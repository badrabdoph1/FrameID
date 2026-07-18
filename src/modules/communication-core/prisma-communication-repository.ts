import { Prisma, type PrismaClient } from "@prisma/client";

import { communicationCategoryKeys, communicationEventNames } from "./events";
import type {
  AppendEntryCommand,
  AppendEntryResult,
  AttachContextCommand,
  CommunicationRepository,
  MarkReadCommand,
  ManageWorkItemCommand,
  NormalizedEntryDraft,
  OpenConversationCommand,
  PublishCampaignCommand,
  TransitionWorkItemCommand,
  WithdrawCampaignCommand,
} from "./repository";
import type { CommunicationActor, CommunicationReader } from "./types";

const CAMPAIGN_AUDIENCE_BATCH_SIZE = 500;

export class CommunicationConflictError extends Error {
  constructor(message = "تغيرت المحادثة منذ فتحها. حدّثها قبل إعادة الإرسال.") {
    super(message);
    this.name = "CommunicationConflictError";
  }
}

function actorFields(actor: CommunicationActor) {
  return {
    userId: actor.type === "CUSTOMER" ? actor.userId : null,
    adminUserId: actor.type === "ADMIN" ? actor.adminUserId : null,
    systemKey: actor.type === "SYSTEM" ? actor.systemKey : null,
  };
}

function entryCreateData(
  conversationId: string,
  sequence: number,
  entry: NormalizedEntryDraft,
) {
  const actor = actorFields(entry.actor);
  return {
    conversationId,
    sequence,
    kind: entry.kind,
    visibility: entry.visibility,
    authorType: entry.actor.type,
    authorUserId: actor.userId,
    authorAdminUserId: actor.adminUserId,
    authorSystemKey: actor.systemKey,
    body: entry.body,
    eventName: entry.eventName,
    metadata: entry.metadata == null ? undefined : entry.metadata as Prisma.InputJsonValue,
    correctionOfEntryId: entry.correctionOfEntryId,
    idempotencyKey: entry.idempotencyKey,
  };
}

function attachmentCreateData(entryId: string, entry: NormalizedEntryDraft, createdAt: Date) {
  const uploader = actorFields(entry.actor);
  return entry.attachments.map((attachment) => ({
    entryId,
    storageProvider: attachment.storageProvider,
    storageKey: attachment.storageKey,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    checksumSha256: attachment.checksumSha256,
    width: attachment.width ?? null,
    height: attachment.height ?? null,
    scanStatus: "PENDING" as const,
    uploadedByType: entry.actor.type,
    uploadedByUserId: uploader.userId,
    uploadedByAdminUserId: uploader.adminUserId,
    uploadedBySystemKey: uploader.systemKey,
    createdAt,
  }));
}

function outboxData(input: {
  aggregateType: string;
  aggregateId: string;
  eventName: string;
  payload: Prisma.InputJsonObject;
  categoryKey: string;
  groupKey?: string | null;
  deduplicationKey: string;
  correlationId?: string | null;
  causationId?: string | null;
  occurredAt: Date;
  availableAt?: Date;
}) {
  return {
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    eventName: input.eventName,
    eventVersion: 1,
    payload: input.payload,
    categoryKey: input.categoryKey,
    groupKey: input.groupKey ?? null,
    deduplicationKey: input.deduplicationKey,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    availableAt: input.availableAt ?? input.occurredAt,
    createdAt: input.occurredAt,
  };
}

function entryCategory(entry: NormalizedEntryDraft) {
  if (entry.kind === "SYSTEM_EVENT") return communicationCategoryKeys.systemEvent;
  if (entry.actor.type === "ADMIN") return communicationCategoryKeys.reply;
  return communicationCategoryKeys.workflow;
}

function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function markActorRead(
  transaction: Prisma.TransactionClient,
  conversationId: string,
  actor: CommunicationActor,
  sequence: number,
  occurredAt: Date,
) {
  if (actor.type === "SYSTEM") return;
  const customer = actor.type === "CUSTOMER";
  await transaction.communicationReadCursor.upsert({
    where: customer
      ? { conversationId_userId: { conversationId, userId: actor.userId } }
      : { conversationId_adminUserId: { conversationId, adminUserId: actor.adminUserId } },
    update: { lastReadSequence: sequence, readAt: occurredAt },
    create: {
      conversationId,
      readerType: actor.type,
      userId: customer ? actor.userId : null,
      adminUserId: customer ? null : actor.adminUserId,
      lastReadSequence: sequence,
      readAt: occurredAt,
      createdAt: occurredAt,
    },
  });
}

export function createPrismaCommunicationRepository(prisma: PrismaClient): CommunicationRepository {
  return {
    async openConversation(command: OpenConversationCommand) {
      return prisma.$transaction(async (transaction) => {
        const existing = await transaction.communicationConversation.findUnique({
          where: {
            sourceModule_idempotencyKey: {
              sourceModule: command.sourceModule,
              idempotencyKey: command.idempotencyKey,
            },
          },
          select: {
            id: true,
            number: true,
            entries: {
              where: { idempotencyKey: command.firstEntry.idempotencyKey },
              select: { id: true, sequence: true },
              take: 1,
            },
            workItem: { select: { id: true } },
          },
        });
        if (existing) {
          const firstEntry = existing.entries[0];
          if (!firstEntry) throw new Error("المحادثة المعادة لا تحتوي المدخل الأول المتوقع.");
          return {
            conversationId: existing.id,
            number: existing.number,
            entryId: firstEntry.id,
            sequence: firstEntry.sequence,
            workItemId: existing.workItem?.id ?? null,
          };
        }

        const creator = actorFields(command.actor);
        const conversation = await transaction.communicationConversation.create({
          data: {
            mode: command.mode,
            tenantId: command.tenantId,
            parentConversationId: command.parentConversationId,
            sourceModule: command.sourceModule,
            typeKey: command.typeKey,
            subject: command.subject,
            replyMode: command.replyMode,
            createdByType: command.actor.type,
            createdByUserId: creator.userId,
            createdByAdminUserId: creator.adminUserId,
            createdBySystemKey: creator.systemKey,
            idempotencyKey: command.idempotencyKey,
            lastActivityAt: command.occurredAt,
            lastSequence: 1,
            lastCustomerVisibleSequence: command.firstEntry.visibility === "CUSTOMER_AND_ADMIN" ? 1 : 0,
            version: 1,
            createdAt: command.occurredAt,
          },
          select: { id: true, number: true },
        });
        const entry = await transaction.communicationEntry.create({
          data: {
            ...entryCreateData(conversation.id, 1, command.firstEntry),
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });

        if (command.mode === "DIRECT" && command.tenantId) {
          await transaction.communicationAudience.create({
            data: {
              conversationId: conversation.id,
              tenantId: command.tenantId,
              reasonCode: "direct",
              lastCustomerVisibleSequence: command.firstEntry.visibility === "CUSTOMER_AND_ADMIN" ? 1 : 0,
              deliveredAt: command.occurredAt,
              createdAt: command.occurredAt,
            },
          });
        }
        await markActorRead(transaction, conversation.id, command.actor, 1, command.occurredAt);

        let workItemId: string | null = null;
        if (command.workItem) {
          const workItem = await transaction.communicationWorkItem.create({
            data: {
              conversationId: conversation.id,
              status: "NEW",
              priority: command.workItem.priority,
              queueKey: command.workItem.queueKey,
              assigneeAdminUserId: command.workItem.assigneeAdminUserId,
              slaPolicyKey: command.workItem.slaPolicyKey,
              firstResponseDueAt: command.workItem.firstResponseDueAt,
              resolutionDueAt: command.workItem.resolutionDueAt,
              lastCustomerMessageAt: command.actor.type === "CUSTOMER" ? command.occurredAt : null,
              lastAdminReplyAt: command.actor.type === "ADMIN" ? command.occurredAt : null,
              waitingSince: command.occurredAt,
              createdAt: command.occurredAt,
            },
            select: { id: true },
          });
          workItemId = workItem.id;
          await transaction.communicationWorkItemEvent.create({
            data: {
              workItemId,
              type: "CREATED",
              actorType: command.actor.type,
              actorUserId: creator.userId,
              actorAdminUserId: creator.adminUserId,
              actorSystemKey: creator.systemKey,
              toStatus: "NEW",
              idempotencyKey: `${command.idempotencyKey}:work-item-created`,
              correlationId: command.correlationId,
              occurredAt: command.occurredAt,
            },
          });
        }

        if (command.contexts.length > 0) {
          await transaction.communicationContextReference.createMany({
            data: command.contexts.map((context) => ({
              conversationId: conversation.id,
              ...context,
              sourceModule: command.sourceModule,
              createdAt: command.occurredAt,
            })),
            skipDuplicates: true,
          });
        }

        const attachments = attachmentCreateData(entry.id, command.firstEntry, command.occurredAt);
        if (attachments.length > 0) {
          await transaction.communicationAttachment.createMany({ data: attachments });
        }
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationConversation",
            aggregateId: conversation.id,
            eventName: communicationEventNames.conversationOpened,
            payload: {
              conversationId: conversation.id,
              entryId: entry.id,
              workItemId,
              tenantId: command.tenantId,
              sequence: 1,
            },
            categoryKey: workItemId ? communicationCategoryKeys.workflow : communicationCategoryKeys.directMessage,
            groupKey: `conversation:${conversation.id}`,
            deduplicationKey: `${command.sourceModule}:conversation-opened:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });

        return { conversationId: conversation.id, number: conversation.number, entryId: entry.id, sequence: 1, workItemId };
      });
    },

    async appendEntry(command: AppendEntryCommand): Promise<AppendEntryResult> {
      return prisma.$transaction(async (transaction) => {
        const existing = await transaction.communicationEntry.findUnique({
          where: {
            conversationId_idempotencyKey: {
              conversationId: command.conversationId,
              idempotencyKey: command.idempotencyKey,
            },
          },
          select: { id: true, sequence: true, conversation: { select: { version: true } } },
        });
        if (existing) {
          return {
            conversationId: command.conversationId,
            entryId: existing.id,
            sequence: existing.sequence,
            version: existing.conversation.version,
          };
        }

        const sequence = command.expectedLastSequence + 1;
        const updated = await transaction.communicationConversation.updateMany({
          where: {
            id: command.conversationId,
            lastSequence: command.expectedLastSequence,
            version: command.expectedVersion,
          },
          data: {
            lastSequence: { increment: 1 },
            version: { increment: 1 },
            lastActivityAt: command.occurredAt,
            ...(command.visibility === "CUSTOMER_AND_ADMIN" ? { lastCustomerVisibleSequence: sequence } : {}),
          },
        });
        if (updated.count !== 1) throw new CommunicationConflictError();

        const entry = await transaction.communicationEntry.create({
          data: {
            ...entryCreateData(command.conversationId, sequence, command),
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });
        const attachments = attachmentCreateData(entry.id, command, command.occurredAt);
        if (attachments.length > 0) {
          await transaction.communicationAttachment.createMany({ data: attachments });
        }
        await markActorRead(transaction, command.conversationId, command.actor, sequence, command.occurredAt);

        const workItem = await transaction.communicationWorkItem.findUnique({
          where: { conversationId: command.conversationId },
          select: {
            id: true,
            status: true,
            version: true,
            firstResponseAt: true,
          },
        });
        if (workItem) {
          const reopensWaitingCustomer = command.actor.type === "CUSTOMER" && workItem.status === "WAITING_CUSTOMER";
          await transaction.communicationWorkItem.update({
            where: { id: workItem.id },
            data: {
              version: { increment: 1 },
              ...(command.actor.type === "CUSTOMER" ? { lastCustomerMessageAt: command.occurredAt } : {}),
              ...(command.actor.type === "ADMIN" ? {
                lastAdminReplyAt: command.occurredAt,
                ...(workItem.firstResponseAt ? {} : { firstResponseAt: command.occurredAt }),
              } : {}),
              ...(reopensWaitingCustomer ? { status: "IN_PROGRESS", waitingSince: command.occurredAt } : {}),
            },
          });
          if (reopensWaitingCustomer) {
            const actor = actorFields(command.actor);
            await transaction.communicationWorkItemEvent.create({
              data: {
                workItemId: workItem.id,
                type: "STATUS_CHANGED",
                actorType: command.actor.type,
                actorUserId: actor.userId,
                actorAdminUserId: actor.adminUserId,
                actorSystemKey: actor.systemKey,
                fromStatus: "WAITING_CUSTOMER",
                toStatus: "IN_PROGRESS",
                reason: "customer_replied",
                idempotencyKey: `${command.idempotencyKey}:customer-replied`,
                correlationId: command.correlationId,
                occurredAt: command.occurredAt,
              },
            });
          }
        }

        if (command.visibility === "CUSTOMER_AND_ADMIN") {
          await transaction.communicationAudience.updateMany({
            where: { conversationId: command.conversationId, withdrawnAt: null },
            data: { lastCustomerVisibleSequence: sequence },
          });
        }
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationConversation",
            aggregateId: command.conversationId,
            eventName: communicationEventNames.entryAppended,
            payload: {
              conversationId: command.conversationId,
              entryId: entry.id,
              sequence,
              visibility: command.visibility,
            },
            categoryKey: entryCategory(command),
            groupKey: `conversation:${command.conversationId}`,
            deduplicationKey: `conversation:${command.conversationId}:entry:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });
        const conversation = await transaction.communicationConversation.findUnique({
          where: { id: command.conversationId },
          select: { version: true },
        });
        if (!conversation) throw new Error("المحادثة غير موجودة.");
        return { conversationId: command.conversationId, entryId: entry.id, sequence, version: conversation.version };
      });
    },

    async attachContext(command: AttachContextCommand) {
      return prisma.$transaction(async (transaction) => {
        const where = {
          conversationId_namespace_entityType_entityId_relationKey: {
            conversationId: command.conversationId,
            ...command.context,
          },
        };
        const existing = await transaction.communicationContextReference.findUnique({ where });
        if (existing) return existing;
        const reference = await transaction.communicationContextReference.create({
          data: {
            conversationId: command.conversationId,
            ...command.context,
            sourceModule: command.sourceModule,
            createdAt: command.occurredAt,
          },
        });
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationConversation",
            aggregateId: command.conversationId,
            eventName: communicationEventNames.contextAttached,
            payload: {
              conversationId: command.conversationId,
              contextReferenceId: reference.id,
              namespace: reference.namespace,
              entityType: reference.entityType,
              entityId: reference.entityId,
              relationKey: reference.relationKey,
            },
            categoryKey: communicationCategoryKeys.systemEvent,
            groupKey: `conversation:${command.conversationId}`,
            deduplicationKey: `${command.sourceModule}:context-attached:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });
        return reference;
      });
    },

    async markRead(command: MarkReadCommand) {
      const persistRead = () => prisma.$transaction(async (transaction) => {
        const conversation = await transaction.communicationConversation.findUnique({
          where: { id: command.conversationId },
          select: { lastSequence: true },
        });
        if (!conversation) throw new Error("المحادثة غير موجودة.");
        if (command.upToSequence > conversation.lastSequence) {
          throw new Error("لا يمكن تعليم Sequence لم تُنشأ بعد كمقروءة.");
        }
        const selector = readerUniqueWhere(command.conversationId, command.reader);
        const existing = await transaction.communicationReadCursor.findUnique({ where: selector });
        if (existing && existing.lastReadSequence >= command.upToSequence) {
          return readCursorResult(command.reader, existing.lastReadSequence, existing.readAt, command.conversationId);
        }
        if (existing) {
          const updated = await transaction.communicationReadCursor.updateMany({
            where: { id: existing.id, lastReadSequence: { lt: command.upToSequence } },
            data: { lastReadSequence: command.upToSequence, readAt: command.occurredAt },
          });
          if (updated.count === 0) {
            const current = await transaction.communicationReadCursor.findUniqueOrThrow({ where: selector });
            return readCursorResult(command.reader, current.lastReadSequence, current.readAt, command.conversationId);
          }
          return readCursorResult(command.reader, command.upToSequence, command.occurredAt, command.conversationId);
        }
        const reader = readerFields(command.reader);
        const created = await transaction.communicationReadCursor.create({
          data: {
            conversationId: command.conversationId,
            readerType: command.reader.type,
            userId: reader.userId,
            adminUserId: reader.adminUserId,
            lastReadSequence: command.upToSequence,
            readAt: command.occurredAt,
            createdAt: command.occurredAt,
          },
        });
        return readCursorResult(command.reader, created.lastReadSequence, created.readAt, command.conversationId);
      });
      try {
        return await persistRead();
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
        return persistRead();
      }
    },

    async getWorkItemState(workItemId: string) {
      return prisma.communicationWorkItem.findUnique({
        where: { id: workItemId },
        select: { id: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
      });
    },

    async transitionWorkItem(command: TransitionWorkItemCommand) {
      return prisma.$transaction(async (transaction) => {
        const existingEvent = await transaction.communicationWorkItemEvent.findUnique({
          where: {
            workItemId_idempotencyKey: {
              workItemId: command.workItemId,
              idempotencyKey: command.idempotencyKey,
            },
          },
          select: { toStatus: true },
        });
        if (existingEvent) {
          const current = await transaction.communicationWorkItem.findUniqueOrThrow({
            where: { id: command.workItemId },
            select: { id: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
          });
          return current;
        }
        const current = await transaction.communicationWorkItem.findUnique({
          where: { id: command.workItemId },
          select: { id: true, conversationId: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
        });
        if (!current) throw new Error("عنصر العمل غير موجود.");
        if (current.status !== command.fromStatus || current.version !== command.expectedVersion) {
          throw new CommunicationConflictError("تغير عنصر العمل منذ فتحه. حدّثه قبل إعادة المحاولة.");
        }

        const conversation = await transaction.communicationConversation.update({
          where: { id: current.conversationId },
          data: {
            lastSequence: { increment: 1 },
            version: { increment: 1 },
            lastActivityAt: command.occurredAt,
          },
          select: { lastSequence: true, version: true },
        });
        await transaction.communicationConversation.update({
          where: { id: current.conversationId },
          data: { lastCustomerVisibleSequence: conversation.lastSequence },
        });
        const workUpdate = await transaction.communicationWorkItem.updateMany({
          where: { id: current.id, status: command.fromStatus, version: command.expectedVersion },
          data: {
            status: command.toStatus,
            version: { increment: 1 },
            waitingSince: ["NEW", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_INTERNAL"].includes(command.toStatus)
              ? command.occurredAt
              : null,
            ...(command.toStatus === "RESOLVED" ? { resolvedAt: command.occurredAt } : {}),
            ...(command.toStatus === "CLOSED" ? { closedAt: command.occurredAt } : {}),
            ...(command.toStatus === "IN_PROGRESS" ? { resolvedAt: null, closedAt: null } : {}),
          },
        });
        if (workUpdate.count !== 1) {
          throw new CommunicationConflictError("تغير عنصر العمل أثناء الانتقال. حدّثه قبل إعادة المحاولة.");
        }

        const actor = actorFields(command.actor);
        const entry = await transaction.communicationEntry.create({
          data: {
            conversationId: current.conversationId,
            sequence: conversation.lastSequence,
            kind: "STATE_CHANGE",
            visibility: "CUSTOMER_AND_ADMIN",
            authorType: command.actor.type,
            authorUserId: actor.userId,
            authorAdminUserId: actor.adminUserId,
            authorSystemKey: actor.systemKey,
            body: command.reason,
            eventName: "communication.work_item.status_changed.v1",
            metadata: { fromStatus: command.fromStatus, toStatus: command.toStatus },
            idempotencyKey: `work-item:${command.workItemId}:${command.idempotencyKey}`,
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });
        await transaction.communicationWorkItemEvent.create({
          data: {
            workItemId: current.id,
            type: "STATUS_CHANGED",
            actorType: command.actor.type,
            actorUserId: actor.userId,
            actorAdminUserId: actor.adminUserId,
            actorSystemKey: actor.systemKey,
            fromStatus: command.fromStatus,
            toStatus: command.toStatus,
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            correlationId: command.correlationId,
            occurredAt: command.occurredAt,
          },
        });
        await transaction.communicationAudience.updateMany({
          where: { conversationId: current.conversationId, withdrawnAt: null },
          data: { lastCustomerVisibleSequence: conversation.lastSequence },
        });
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationWorkItem",
            aggregateId: current.id,
            eventName: communicationEventNames.workItemTransitioned,
            payload: {
              workItemId: current.id,
              conversationId: current.conversationId,
              timelineEntryId: entry.id,
              fromStatus: command.fromStatus,
              toStatus: command.toStatus,
              sequence: conversation.lastSequence,
            },
            categoryKey: communicationCategoryKeys.workflow,
            groupKey: `conversation:${current.conversationId}`,
            deduplicationKey: `work-item:${current.id}:transition:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });
        return {
          id: current.id,
          status: command.toStatus,
          priority: current.priority,
          queueKey: current.queueKey,
          assigneeAdminUserId: current.assigneeAdminUserId,
          version: command.expectedVersion + 1,
        };
      });
    },

    async manageWorkItem(command: ManageWorkItemCommand) {
      return prisma.$transaction(async (transaction) => {
        const existingEvent = await transaction.communicationWorkItemEvent.findUnique({
          where: { workItemId_idempotencyKey: { workItemId: command.workItemId, idempotencyKey: command.idempotencyKey } },
          select: { id: true },
        });
        if (existingEvent) {
          return transaction.communicationWorkItem.findUniqueOrThrow({
            where: { id: command.workItemId },
            select: { id: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
          });
        }

        const current = await transaction.communicationWorkItem.findUnique({
          where: { id: command.workItemId },
          select: { id: true, conversationId: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
        });
        if (!current) throw new Error("عنصر العمل غير موجود.");
        if (current.version !== command.expectedVersion) {
          throw new CommunicationConflictError("تغير عنصر العمل منذ فتحه. حدّثه قبل إعادة المحاولة.");
        }

        const changeMatches = command.change.type === "PRIORITY"
          ? current.priority === command.change.fromPriority
          : command.change.type === "ASSIGNEE"
            ? current.assigneeAdminUserId === command.change.fromAssigneeAdminUserId
            : current.queueKey === command.change.fromQueueKey;
        if (!changeMatches) throw new CommunicationConflictError("تغيرت قيمة عنصر العمل قبل حفظ التعديل.");

        const updateData = command.change.type === "PRIORITY"
          ? { priority: command.change.toPriority, version: { increment: 1 } }
          : command.change.type === "ASSIGNEE"
            ? { assigneeAdminUserId: command.change.toAssigneeAdminUserId, version: { increment: 1 } }
            : { queueKey: command.change.toQueueKey, version: { increment: 1 } };
        const updated = await transaction.communicationWorkItem.updateMany({
          where: { id: current.id, version: command.expectedVersion },
          data: updateData,
        });
        if (updated.count !== 1) throw new CommunicationConflictError("تغير عنصر العمل أثناء الحفظ.");

        const conversation = await transaction.communicationConversation.update({
          where: { id: current.conversationId },
          data: { lastSequence: { increment: 1 }, version: { increment: 1 }, lastActivityAt: command.occurredAt },
          select: { lastSequence: true, version: true },
        });
        const metadata = command.change.type === "PRIORITY"
          ? { fromPriority: command.change.fromPriority, toPriority: command.change.toPriority }
          : command.change.type === "ASSIGNEE"
            ? { fromAssigneeId: command.change.fromAssigneeAdminUserId, toAssigneeId: command.change.toAssigneeAdminUserId }
            : { fromQueueKey: command.change.fromQueueKey, toQueueKey: command.change.toQueueKey };
        const entry = await transaction.communicationEntry.create({
          data: {
            conversationId: current.conversationId,
            sequence: conversation.lastSequence,
            kind: command.change.type === "ASSIGNEE" ? "ASSIGNMENT" : "STATE_CHANGE",
            visibility: "ADMIN_ONLY",
            authorType: "ADMIN",
            authorAdminUserId: command.actor.adminUserId,
            body: command.reason,
            eventName: communicationEventNames.workItemManaged,
            metadata,
            idempotencyKey: `work-item:${current.id}:manage:${command.idempotencyKey}`,
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });
        await transaction.communicationWorkItemEvent.create({
          data: {
            workItemId: current.id,
            type: command.change.type === "PRIORITY" ? "PRIORITY_CHANGED" : command.change.type === "ASSIGNEE" ? "ASSIGNED" : "QUEUE_CHANGED",
            actorType: "ADMIN",
            actorAdminUserId: command.actor.adminUserId,
            fromPriority: command.change.type === "PRIORITY" ? command.change.fromPriority : null,
            toPriority: command.change.type === "PRIORITY" ? command.change.toPriority : null,
            fromAssigneeId: command.change.type === "ASSIGNEE" ? command.change.fromAssigneeAdminUserId : null,
            toAssigneeId: command.change.type === "ASSIGNEE" ? command.change.toAssigneeAdminUserId : null,
            fromQueueKey: command.change.type === "QUEUE" ? command.change.fromQueueKey : null,
            toQueueKey: command.change.type === "QUEUE" ? command.change.toQueueKey : null,
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            correlationId: command.correlationId,
            occurredAt: command.occurredAt,
          },
        });
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationWorkItem",
            aggregateId: current.id,
            eventName: communicationEventNames.workItemManaged,
            payload: { workItemId: current.id, conversationId: current.conversationId, timelineEntryId: entry.id, changeType: command.change.type },
            categoryKey: communicationCategoryKeys.workflow,
            groupKey: `conversation:${current.conversationId}`,
            deduplicationKey: `work-item:${current.id}:managed:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });
        return transaction.communicationWorkItem.findUniqueOrThrow({
          where: { id: current.id },
          select: { id: true, status: true, priority: true, queueKey: true, assigneeAdminUserId: true, version: true },
        });
      });
    },

    async publishCampaign(command: PublishCampaignCommand) {
      return prisma.$transaction(async (transaction) => {
        const existing = await transaction.communicationConversation.findUnique({
          where: {
            sourceModule_idempotencyKey: {
              sourceModule: command.sourceModule,
              idempotencyKey: command.idempotencyKey,
            },
          },
          select: {
            id: true,
            number: true,
            campaign: { select: { id: true, recipientCount: true } },
          },
        });
        if (existing?.campaign) {
          return {
            campaignId: existing.campaign.id,
            conversationId: existing.id,
            number: existing.number,
            recipientCount: existing.campaign.recipientCount,
          };
        }

        const creator = actorFields(command.actor);
        const conversation = await transaction.communicationConversation.create({
          data: {
            mode: "BROADCAST",
            tenantId: null,
            sourceModule: command.sourceModule,
            typeKey: command.typeKey,
            subject: command.subject,
            replyMode: "DISABLED",
            createdByType: "ADMIN",
            createdByAdminUserId: creator.adminUserId,
            idempotencyKey: command.idempotencyKey,
            lastActivityAt: command.occurredAt,
            lastSequence: 1,
            lastCustomerVisibleSequence: 1,
            version: 1,
            createdAt: command.occurredAt,
          },
          select: { id: true, number: true },
        });
        const entry = await transaction.communicationEntry.create({
          data: {
            ...entryCreateData(conversation.id, 1, command.entry),
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });
        const scheduled = Boolean(command.scheduledAt && command.scheduledAt > command.occurredAt);
        const campaign = await transaction.communicationCampaign.create({
          data: {
            conversationId: conversation.id,
            status: scheduled ? "SCHEDULED" : "PUBLISHED",
            audienceDefinition: command.audienceDefinition as Prisma.InputJsonValue,
            audienceDefinitionVersion: command.audienceDefinitionVersion,
            recipientCount: command.tenantIds.length,
            createdByAdminUserId: command.actor.adminUserId,
            scheduledAt: command.scheduledAt,
            publishedAt: scheduled ? null : command.occurredAt,
            createdAt: command.occurredAt,
          },
          select: { id: true },
        });
        const audienceRows = command.tenantIds.map((tenantId) => ({
          conversationId: conversation.id,
          tenantId,
          reasonCode: "campaign",
          audienceVersion: command.audienceDefinitionVersion,
          lastCustomerVisibleSequence: 1,
          deliveredAt: scheduled ? null : command.occurredAt,
          createdAt: command.occurredAt,
        }));
        for (const batch of splitIntoBatches(audienceRows, CAMPAIGN_AUDIENCE_BATCH_SIZE)) {
          await transaction.communicationAudience.createMany({ data: batch, skipDuplicates: true });
        }
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationCampaign",
            aggregateId: campaign.id,
            eventName: communicationEventNames.campaignPublished,
            payload: {
              campaignId: campaign.id,
              conversationId: conversation.id,
              entryId: entry.id,
              recipientCount: command.tenantIds.length,
            },
            categoryKey: communicationCategoryKeys.campaign,
            groupKey: `campaign:${campaign.id}`,
            deduplicationKey: `${command.sourceModule}:campaign-published:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
            availableAt: command.scheduledAt ?? command.occurredAt,
          }),
        });
        return {
          campaignId: campaign.id,
          conversationId: conversation.id,
          number: conversation.number,
          recipientCount: command.tenantIds.length,
        };
      });
    },

    async withdrawCampaign(command: WithdrawCampaignCommand) {
      return prisma.$transaction(async (transaction) => {
        const campaign = await transaction.communicationCampaign.findUnique({
          where: { id: command.campaignId },
          select: { id: true, conversationId: true, status: true, withdrawnAt: true },
        });
        if (!campaign) throw new Error("الحملة غير موجودة.");
        if (campaign.status === "WITHDRAWN" && campaign.withdrawnAt) {
          return { campaignId: campaign.id, conversationId: campaign.conversationId, withdrawnAt: campaign.withdrawnAt };
        }
        if (campaign.status === "CANCELLED") throw new Error("لا يمكن سحب حملة ملغاة.");
        await transaction.communicationCampaign.update({
          where: { id: campaign.id },
          data: { status: "WITHDRAWN", withdrawnAt: command.occurredAt, withdrawnReason: command.reason },
        });
        await transaction.communicationAudience.updateMany({
          where: { conversationId: campaign.conversationId, withdrawnAt: null },
          data: { withdrawnAt: command.occurredAt },
        });
        await transaction.communicationConversation.update({
          where: { id: campaign.conversationId },
          data: { lifecycleState: "WITHDRAWN", version: { increment: 1 }, lastActivityAt: command.occurredAt },
        });
        await transaction.communicationOutboxEvent.create({
          data: outboxData({
            aggregateType: "CommunicationCampaign",
            aggregateId: campaign.id,
            eventName: communicationEventNames.campaignWithdrawn,
            payload: { campaignId: campaign.id, conversationId: campaign.conversationId },
            categoryKey: communicationCategoryKeys.campaign,
            groupKey: `campaign:${campaign.id}`,
            deduplicationKey: `campaign:${campaign.id}:withdrawn:${command.idempotencyKey}`,
            correlationId: command.correlationId,
            causationId: command.causationId,
            occurredAt: command.occurredAt,
          }),
        });
        return { campaignId: campaign.id, conversationId: campaign.conversationId, withdrawnAt: command.occurredAt };
      });
    },
  };
}

function readerFields(reader: CommunicationReader) {
  return {
    userId: reader.type === "CUSTOMER" ? reader.userId : null,
    adminUserId: reader.type === "ADMIN" ? reader.adminUserId : null,
  };
}

function readerUniqueWhere(conversationId: string, reader: CommunicationReader) {
  return reader.type === "CUSTOMER"
    ? { conversationId_userId: { conversationId, userId: reader.userId } }
    : { conversationId_adminUserId: { conversationId, adminUserId: reader.adminUserId } };
}

function readCursorResult(
  reader: CommunicationReader,
  lastReadSequence: number,
  readAt: Date,
  conversationId: string,
) {
  return { conversationId, reader, lastReadSequence, readAt };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
