import { describe, expect, it } from "vitest";

import { createCommunicationCore } from "@/modules/communication-core/service";
import type {
  AppendEntryCommand,
  AttachContextCommand,
  CommunicationRepository,
  MarkReadCommand,
  ManageWorkItemCommand,
  OpenConversationCommand,
  PublishCampaignCommand,
  WithdrawCampaignCommand,
  TransitionWorkItemCommand,
  WorkItemState,
} from "@/modules/communication-core/repository";
import type { CommunicationWorkItemStatus } from "@/modules/communication-core/types";

const NOW = new Date("2026-07-18T12:00:00.000Z");

class RecordingCommunicationRepository implements CommunicationRepository {
  openCommands: OpenConversationCommand[] = [];
  appendCommands: AppendEntryCommand[] = [];
  contextCommands: AttachContextCommand[] = [];
  readCommands: MarkReadCommand[] = [];
  transitionCommands: TransitionWorkItemCommand[] = [];
  manageCommands: ManageWorkItemCommand[] = [];
  campaignCommands: PublishCampaignCommand[] = [];
  withdrawalCommands: WithdrawCampaignCommand[] = [];
  currentWorkItem: WorkItemState = { id: "work-1", status: "NEW" as CommunicationWorkItemStatus, priority: "NORMAL", queueKey: "support", assigneeAdminUserId: null, version: 2 };

  async openConversation(command: OpenConversationCommand) {
    this.openCommands.push(command);
    return { conversationId: "conversation-1", number: 101, entryId: "entry-1", sequence: 1, workItemId: command.workItem ? "work-1" : null };
  }

  async appendEntry(command: AppendEntryCommand) {
    this.appendCommands.push(command);
    return { conversationId: command.conversationId, entryId: `entry-${this.appendCommands.length + 1}`, sequence: command.expectedLastSequence + 1, version: command.expectedVersion + 1 };
  }

  async attachContext(command: AttachContextCommand) {
    this.contextCommands.push(command);
    return { id: "context-1", conversationId: command.conversationId, ...command.context, sourceModule: command.sourceModule, createdAt: command.occurredAt };
  }

  async markRead(command: MarkReadCommand) {
    this.readCommands.push(command);
    return { conversationId: command.conversationId, reader: command.reader, lastReadSequence: command.upToSequence, readAt: command.occurredAt };
  }

  async getWorkItemState() {
    return this.currentWorkItem;
  }

  async transitionWorkItem(command: TransitionWorkItemCommand) {
    this.transitionCommands.push(command);
    this.currentWorkItem = { ...this.currentWorkItem, id: command.workItemId, status: command.toStatus, version: command.expectedVersion + 1 };
    return this.currentWorkItem;
  }

  async manageWorkItem(command: ManageWorkItemCommand) {
    this.manageCommands.push(command);
    this.currentWorkItem = {
      ...this.currentWorkItem,
      ...(command.change.type === "PRIORITY" ? { priority: command.change.toPriority } : {}),
      ...(command.change.type === "ASSIGNEE" ? { assigneeAdminUserId: command.change.toAssigneeAdminUserId } : {}),
      ...(command.change.type === "QUEUE" ? { queueKey: command.change.toQueueKey } : {}),
      version: command.expectedVersion + 1,
    };
    return this.currentWorkItem;
  }

  async publishCampaign(command: PublishCampaignCommand) {
    this.campaignCommands.push(command);
    return { campaignId: "campaign-1", conversationId: "conversation-2", number: 102, recipientCount: command.tenantIds.length };
  }

  async withdrawCampaign(command: WithdrawCampaignCommand) {
    this.withdrawalCommands.push(command);
    return { campaignId: command.campaignId, conversationId: "conversation-2", withdrawnAt: command.occurredAt };
  }
}

function createFixture() {
  const repository = new RecordingCommunicationRepository();
  const core = createCommunicationCore(repository, { now: () => NOW });
  return { repository, core };
}

describe("communication core service", () => {
  it("opens a direct request with one source entry, optional work item, and generic contexts", async () => {
    const { repository, core } = createFixture();

    const result = await core.openConversation({
      sourceModule: " Services ",
      idempotencyKey: "acquisition:42",
      mode: "DIRECT",
      tenantId: "tenant-1",
      typeKey: " Service.Request ",
      subject: "  طلب تصميم دعوة  ",
      actor: { type: "CUSTOMER", userId: "user-1" },
      firstEntry: {
        body: " أريد دعوة جديدة ",
        idempotencyKey: "first-entry",
        attachments: [{
          storageProvider: "private-local",
          storageKey: "communications/tenant-1/upload-1.png",
          originalName: "screen.png",
          mimeType: "image/png",
          sizeBytes: 2048,
          checksumSha256: "a".repeat(64),
          width: 1200,
          height: 800,
        }],
      },
      workItem: { queueKey: " Product ", priority: "NORMAL" },
      contexts: [
        { namespace: "services", entityType: "acquisition", entityId: "acq-42", relationKey: "primary" },
        { namespace: "sites", entityType: "site", entityId: "site-7", relationKey: "related" },
      ],
      correlationId: "corr-1",
    });

    expect(result).toMatchObject({ conversationId: "conversation-1", number: 101, sequence: 1, workItemId: "work-1" });
    expect(repository.openCommands).toHaveLength(1);
    expect(repository.openCommands[0]).toMatchObject({
      sourceModule: "services",
      typeKey: "service.request",
      subject: "طلب تصميم دعوة",
      tenantId: "tenant-1",
      occurredAt: NOW,
      firstEntry: { body: "أريد دعوة جديدة", kind: "MESSAGE", visibility: "CUSTOMER_AND_ADMIN" },
      workItem: { queueKey: "product", priority: "NORMAL" },
    });
    expect(repository.openCommands[0]?.firstEntry.attachments).toHaveLength(1);
    expect(repository.openCommands[0]?.contexts).toHaveLength(2);
  });

  it("rejects customer attempts to create admin-only timeline entries before persistence", async () => {
    const { repository, core } = createFixture();

    await expect(core.appendEntry({
      conversationId: "conversation-1",
      actor: { type: "CUSTOMER", userId: "user-1" },
      kind: "INTERNAL_NOTE",
      visibility: "ADMIN_ONLY",
      body: "ملاحظة",
      idempotencyKey: "entry-2",
      expectedLastSequence: 1,
      expectedVersion: 1,
    })).rejects.toThrow("العميل");

    expect(repository.appendCommands).toHaveLength(0);
  });

  it("routes every broadcast through the campaign command instead of creating an audience-less conversation", async () => {
    const { repository, core } = createFixture();

    await expect(core.openConversation({
      sourceModule: "services",
      idempotencyKey: "broadcast-1",
      mode: "BROADCAST",
      typeKey: "campaign.notice",
      subject: "إعلان",
      actor: { type: "SYSTEM", systemKey: "services" },
      firstEntry: { body: "إعلان عام", idempotencyKey: "entry-1" },
    })).rejects.toThrow("publishCampaign");

    expect(repository.openCommands).toHaveLength(0);
  });

  it("provides a dedicated product-neutral system event extension point", async () => {
    const { repository, core } = createFixture();

    await core.appendSystemEvent({
      conversationId: "conversation-1",
      systemKey: "services.fulfillment",
      eventName: "services.fulfillment.started.v1",
      metadata: { acquisitionId: "acq-42" },
      idempotencyKey: "fulfillment-started:42",
      expectedLastSequence: 1,
      expectedVersion: 1,
      correlationId: "corr-1",
    });

    expect(repository.appendCommands[0]).toMatchObject({
      actor: { type: "SYSTEM", systemKey: "services.fulfillment" },
      kind: "SYSTEM_EVENT",
      visibility: "CUSTOMER_AND_ADMIN",
      eventName: "services.fulfillment.started.v1",
      metadata: { acquisitionId: "acq-42" },
    });
  });

  it("checks the persisted work-item state before issuing a guarded transition", async () => {
    const { repository, core } = createFixture();

    await expect(core.transitionWorkItem({
      workItemId: "work-1",
      toStatus: "RESOLVED",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      reason: "تم الحل",
      idempotencyKey: "resolve-1",
    })).rejects.toThrow("انتقال حالة غير مسموح");

    await core.transitionWorkItem({
      workItemId: "work-1",
      toStatus: "IN_PROGRESS",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      reason: "بدء المراجعة",
      idempotencyKey: "review-1",
      correlationId: "corr-1",
    });

    expect(repository.transitionCommands[0]).toMatchObject({
      fromStatus: "NEW",
      toStatus: "IN_PROGRESS",
      expectedVersion: 2,
      reason: "بدء المراجعة",
    });
  });

  it("manages priority and assignment through a product-neutral guarded command", async () => {
    const { repository, core } = createFixture();

    await core.manageWorkItem({
      workItemId: "work-1",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      change: { type: "PRIORITY", priority: "HIGH" },
      reason: "أثر مباشر على النشر",
      idempotencyKey: "priority-1",
    });

    expect(repository.manageCommands[0]).toMatchObject({
      expectedVersion: 2,
      change: { type: "PRIORITY", fromPriority: "NORMAL", toPriority: "HIGH" },
    });

    await core.manageWorkItem({
      workItemId: "work-1",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      change: { type: "ASSIGNEE", assigneeAdminUserId: "admin-2" },
      idempotencyKey: "assign-1",
    });

    expect(repository.manageCommands[1]).toMatchObject({
      expectedVersion: 3,
      change: { type: "ASSIGNEE", fromAssigneeAdminUserId: null, toAssigneeAdminUserId: "admin-2" },
    });
  });

  it("attaches opaque context without interpreting the owning entity", async () => {
    const { repository, core } = createFixture();

    await core.attachContext({
      conversationId: "conversation-1",
      sourceModule: " Billing ",
      context: { namespace: "Billing", entityType: "Payment_Request", entityId: "PAY-99", relationKey: "Source" },
      idempotencyKey: "context:payment:99",
      correlationId: "corr-2",
    });

    expect(repository.contextCommands[0]).toMatchObject({
      sourceModule: "billing",
      context: { namespace: "billing", entityType: "payment_request", entityId: "PAY-99", relationKey: "source" },
    });
  });

  it("marks reads to an explicit positive sequence and rejects system readers", async () => {
    const { repository, core } = createFixture();

    await core.markRead({
      conversationId: "conversation-1",
      reader: { type: "CUSTOMER", userId: "user-1" },
      upToSequence: 4,
    });
    expect(repository.readCommands[0]).toMatchObject({ upToSequence: 4, occurredAt: NOW });

    await expect(core.markRead({
      conversationId: "conversation-1",
      reader: { type: "SYSTEM", systemKey: "worker" } as never,
      upToSequence: 4,
    })).rejects.toThrow("القراءة");

    await expect(core.markRead({
      conversationId: "conversation-1",
      reader: { type: "CUSTOMER", userId: "user-1" },
      upToSequence: 0,
    })).rejects.toThrow("موجب");
  });

  it("publishes one immutable broadcast entry to a deduplicated explicit audience", async () => {
    const { repository, core } = createFixture();

    const result = await core.publishCampaign({
      sourceModule: "admin.communications",
      idempotencyKey: "campaign:maintenance:1",
      typeKey: "campaign.maintenance",
      subject: "صيانة مجدولة",
      body: "ستتوقف الخدمة لمدة عشر دقائق.",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      tenantIds: ["tenant-1", "tenant-1", "tenant-2"],
      audienceDefinition: { mode: "EXPLICIT" },
      audienceDefinitionVersion: 1,
    });

    expect(result.recipientCount).toBe(2);
    expect(repository.campaignCommands[0]).toMatchObject({
      tenantIds: ["tenant-1", "tenant-2"],
      entry: { body: "ستتوقف الخدمة لمدة عشر دقائق.", kind: "MESSAGE", visibility: "CUSTOMER_AND_ADMIN" },
    });
    expect(repository.campaignCommands[0]).not.toHaveProperty("body");
  });

  it("withdraws a campaign only through an audited admin command", async () => {
    const { repository, core } = createFixture();
    await core.withdrawCampaign({ campaignId: "campaign-1", actor: { type: "ADMIN", adminUserId: "admin-1" }, reason: "معلومة غير دقيقة", idempotencyKey: "withdraw-1" });
    expect(repository.withdrawalCommands[0]).toMatchObject({ campaignId: "campaign-1", reason: "معلومة غير دقيقة", occurredAt: NOW });
  });
});
