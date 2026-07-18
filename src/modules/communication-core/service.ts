import type { CommunicationRepository, NormalizedEntryDraft } from "./repository";
import { assertWorkItemTransition } from "./state-machine";
import type {
  AppendEntryInput,
  AppendSystemEventInput,
  AttachContextInput,
  CommunicationActor,
  CommunicationEntryInput,
  MarkReadInput,
  ManageWorkItemInput,
  OpenConversationInput,
  PublishCampaignInput,
  WithdrawCampaignInput,
  TransitionWorkItemInput,
} from "./types";
import {
  assertConversationScope,
  assertEntryAccess,
  normalizeActor,
  normalizeAttachment,
  normalizeContextReference,
  normalizeOptionalIdentifier,
  normalizeRequiredText,
  normalizeStableKey,
} from "./validation";

type CommunicationCoreOptions = { now?: () => Date };

function trace(input: { correlationId?: string | null; causationId?: string | null }, now: () => Date) {
  return {
    correlationId: normalizeOptionalIdentifier(input.correlationId, "correlationId"),
    causationId: normalizeOptionalIdentifier(input.causationId, "causationId"),
    occurredAt: now(),
  };
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} يجب أن يكون عددًا صحيحًا غير سالب.`);
  return value;
}

function normalizeEntry(input: CommunicationEntryInput, actor: CommunicationActor): NormalizedEntryDraft {
  const normalizedActor = normalizeActor(actor);
  const kind = input.kind ?? "MESSAGE";
  const visibility = input.visibility ?? "CUSTOMER_AND_ADMIN";
  assertEntryAccess(normalizedActor, kind, visibility);
  const body = input.body == null ? null : normalizeRequiredText(input.body, "نص الرسالة", 20_000);
  const eventName = input.eventName == null ? null : normalizeStableKey(input.eventName, "eventName");
  if (!body && !eventName) throw new Error("المدخل يحتاج نصًا أو اسم حدث.");
  return {
    actor: normalizedActor,
    kind,
    visibility,
    body,
    eventName,
    metadata: input.metadata ?? null,
    correctionOfEntryId: normalizeOptionalIdentifier(input.correctionOfEntryId, "correctionOfEntryId"),
    idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
    attachments: (input.attachments ?? []).map(normalizeAttachment),
  };
}

export function createCommunicationCore(
  repository: CommunicationRepository,
  options: CommunicationCoreOptions = {},
) {
  const now = options.now ?? (() => new Date());

  return {
    async openConversation(input: OpenConversationInput) {
      if (input.mode === "BROADCAST") {
        throw new Error("استخدم publishCampaign لإنشاء Broadcast حتى لا توجد محادثة بلا جمهور.");
      }
      const tenantId = normalizeOptionalIdentifier(input.tenantId, "tenantId");
      assertConversationScope(input.mode, tenantId);
      const actor = normalizeActor(input.actor);
      return repository.openConversation({
        sourceModule: normalizeStableKey(input.sourceModule, "sourceModule"),
        idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
        mode: input.mode,
        tenantId,
        parentConversationId: normalizeOptionalIdentifier(input.parentConversationId, "parentConversationId"),
        typeKey: normalizeStableKey(input.typeKey, "typeKey"),
        subject: normalizeRequiredText(input.subject, "عنوان المحادثة", 180),
        replyMode: input.replyMode ?? "ENABLED",
        actor,
        firstEntry: normalizeEntry(input.firstEntry, actor),
        workItem: input.workItem ? {
          queueKey: normalizeStableKey(input.workItem.queueKey, "queueKey"),
          priority: input.workItem.priority ?? "NORMAL",
          assigneeAdminUserId: normalizeOptionalIdentifier(input.workItem.assigneeAdminUserId, "assigneeAdminUserId"),
          slaPolicyKey: input.workItem.slaPolicyKey ? normalizeStableKey(input.workItem.slaPolicyKey, "slaPolicyKey") : null,
          firstResponseDueAt: input.workItem.firstResponseDueAt ?? null,
          resolutionDueAt: input.workItem.resolutionDueAt ?? null,
        } : null,
        contexts: (input.contexts ?? []).map(normalizeContextReference),
        ...trace(input, now),
      });
    },

    async appendEntry(input: AppendEntryInput) {
      const actor = normalizeActor(input.actor);
      return repository.appendEntry({
        conversationId: normalizeRequiredText(input.conversationId, "conversationId", 200),
        ...normalizeEntry(input, actor),
        expectedLastSequence: positiveInteger(input.expectedLastSequence, "expectedLastSequence"),
        expectedVersion: positiveInteger(input.expectedVersion, "expectedVersion"),
        ...trace(input, now),
      });
    },

    async appendSystemEvent(input: AppendSystemEventInput) {
      const actor = normalizeActor({ type: "SYSTEM", systemKey: input.systemKey });
      return repository.appendEntry({
        conversationId: normalizeRequiredText(input.conversationId, "conversationId", 200),
        ...normalizeEntry({
          body: input.body,
          eventName: input.eventName,
          metadata: input.metadata,
          kind: "SYSTEM_EVENT",
          visibility: input.visibility ?? "CUSTOMER_AND_ADMIN",
          idempotencyKey: input.idempotencyKey,
        }, actor),
        expectedLastSequence: positiveInteger(input.expectedLastSequence, "expectedLastSequence"),
        expectedVersion: positiveInteger(input.expectedVersion, "expectedVersion"),
        ...trace(input, now),
      });
    },

    async attachContext(input: AttachContextInput) {
      const sourceModule = normalizeStableKey(input.sourceModule, "sourceModule");
      return repository.attachContext({
        conversationId: normalizeRequiredText(input.conversationId, "conversationId", 200),
        sourceModule,
        actor: { type: "SYSTEM", systemKey: sourceModule },
        context: normalizeContextReference(input.context),
        idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
        ...trace(input, now),
      });
    },

    async markRead(input: MarkReadInput) {
      const reader = input.reader as CommunicationActor;
      if (reader.type === "SYSTEM") throw new Error("القراءة تخص عميلًا أو أدمن فقط.");
      return repository.markRead({
        conversationId: normalizeRequiredText(input.conversationId, "conversationId", 200),
        reader: normalizeActor(reader) as MarkReadInput["reader"],
        upToSequence: (() => {
          const sequence = positiveInteger(input.upToSequence, "upToSequence");
          if (sequence === 0) throw new Error("upToSequence يجب أن يكون عددًا موجبًا.");
          return sequence;
        })(),
        occurredAt: now(),
      });
    },

    async transitionWorkItem(input: TransitionWorkItemInput) {
      const workItemId = normalizeRequiredText(input.workItemId, "workItemId", 200);
      const current = await repository.getWorkItemState(workItemId);
      if (!current) throw new Error("عنصر العمل غير موجود.");
      assertWorkItemTransition(current.status, input.toStatus);
      return repository.transitionWorkItem({
        workItemId,
        actor: normalizeActor(input.actor),
        fromStatus: current.status,
        toStatus: input.toStatus,
        expectedVersion: current.version,
        reason: input.reason == null ? null : normalizeRequiredText(input.reason, "سبب الانتقال", 2_000),
        idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
        ...trace(input, now),
      });
    },

    async manageWorkItem(input: ManageWorkItemInput) {
      const workItemId = normalizeRequiredText(input.workItemId, "workItemId", 200);
      if (input.actor.type !== "ADMIN") throw new Error("إدارة عنصر العمل متاحة للأدمن فقط.");
      const current = await repository.getWorkItemState(workItemId);
      if (!current) throw new Error("عنصر العمل غير موجود.");

      const change = input.change.type === "PRIORITY"
        ? { type: "PRIORITY" as const, fromPriority: current.priority, toPriority: input.change.priority }
        : input.change.type === "ASSIGNEE"
          ? {
              type: "ASSIGNEE" as const,
              fromAssigneeAdminUserId: current.assigneeAdminUserId,
              toAssigneeAdminUserId: normalizeOptionalIdentifier(input.change.assigneeAdminUserId, "assigneeAdminUserId"),
            }
          : {
              type: "QUEUE" as const,
              fromQueueKey: current.queueKey,
              toQueueKey: normalizeStableKey(input.change.queueKey, "queueKey"),
            };

      return repository.manageWorkItem({
        workItemId,
        actor: normalizeActor(input.actor) as ManageWorkItemInput["actor"],
        expectedVersion: current.version,
        change,
        reason: input.reason == null ? null : normalizeRequiredText(input.reason, "سبب التغيير", 2_000),
        idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
        ...trace(input, now),
      });
    },

    async publishCampaign(input: PublishCampaignInput) {
      if (input.actor.type !== "ADMIN") throw new Error("نشر الحملات متاح للأدمن فقط.");
      const actor = normalizeActor(input.actor) as PublishCampaignInput["actor"];
      const tenantIds = [...new Set(input.tenantIds.map((id) => id.trim()).filter(Boolean))];
      if (tenantIds.length === 0) throw new Error("جمهور الحملة فارغ.");
      if (!Number.isSafeInteger(input.audienceDefinitionVersion) || input.audienceDefinitionVersion < 1) {
        throw new Error("إصدار تعريف الجمهور غير صالح.");
      }
      const idempotencyKey = normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200);
      return repository.publishCampaign({
        sourceModule: normalizeStableKey(input.sourceModule, "sourceModule"),
        idempotencyKey,
        typeKey: normalizeStableKey(input.typeKey, "typeKey"),
        subject: normalizeRequiredText(input.subject, "عنوان الحملة", 180),
        actor,
        tenantIds,
        audienceDefinition: input.audienceDefinition,
        audienceDefinitionVersion: input.audienceDefinitionVersion,
        scheduledAt: input.scheduledAt ?? null,
        entry: normalizeEntry({ body: input.body, idempotencyKey: `${idempotencyKey}:entry` }, actor),
        ...trace(input, now),
      });
    },

    async withdrawCampaign(input: WithdrawCampaignInput) {
      if (input.actor.type !== "ADMIN") throw new Error("سحب الحملات متاح للأدمن فقط.");
      return repository.withdrawCampaign({
        campaignId: normalizeRequiredText(input.campaignId, "campaignId", 200),
        actor: normalizeActor(input.actor) as WithdrawCampaignInput["actor"],
        reason: normalizeRequiredText(input.reason, "سبب السحب", 2_000),
        idempotencyKey: normalizeRequiredText(input.idempotencyKey, "idempotencyKey", 200),
        ...trace(input, now),
      });
    },
  };
}
