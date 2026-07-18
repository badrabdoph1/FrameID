import type {
  AppendEntryInput,
  CommunicationAttachmentInput,
  MarkReadInput,
  ManageWorkItemInput,
  OpenConversationInput,
  TransitionWorkItemInput,
  CommunicationWorkItemStatus,
} from "@/modules/communication-core/types";
import type {
  AppendEntryResult,
  OpenConversationResult,
  ReadCursorRecord,
  WorkItemState,
} from "@/modules/communication-core/repository";

type ConversationSnapshot = {
  id: string;
  mode: "DIRECT" | "BROADCAST";
  replyMode: "ENABLED" | "DISABLED" | "PRIVATE_BRANCH";
  lastSequence: number;
  lastCustomerVisibleSequence: number;
  version: number;
  workItem: { id: string; status: CommunicationWorkItemStatus } | null;
};

type CommunicationCommandCore = {
  openConversation(input: OpenConversationInput): Promise<OpenConversationResult>;
  appendEntry(input: AppendEntryInput): Promise<AppendEntryResult>;
  markRead(input: MarkReadInput): Promise<ReadCursorRecord>;
  transitionWorkItem(input: TransitionWorkItemInput): Promise<WorkItemState>;
  manageWorkItem(input: ManageWorkItemInput): Promise<WorkItemState>;
};

type CommunicationCommandQueries = {
  getCustomerConversation(input: {
    conversationId: string;
    tenantId: string;
    userId: string;
  }): Promise<ConversationSnapshot | null>;
  getAdminConversation(conversationId: string): Promise<ConversationSnapshot | null>;
};

function assertReplyable(snapshot: ConversationSnapshot | null): asserts snapshot is ConversationSnapshot {
  if (!snapshot) throw new Error("المحادثة غير موجودة أو لا تملك صلاحية الوصول إليها.");
  if (snapshot.mode === "BROADCAST" || snapshot.replyMode === "DISABLED") {
    throw new Error("الرد غير متاح داخل هذه المحادثة.");
  }
}

export function createCommunicationCenterCommands(input: {
  core: CommunicationCommandCore;
  queries: CommunicationCommandQueries;
}) {
  return {
    async createCustomerRequest(command: {
      tenantId: string;
      userId: string;
      siteId?: string | null;
      typeKey: string;
      subject: string;
      body: string;
      attachments: CommunicationAttachmentInput[];
      idempotencyKey: string;
    }) {
      return input.core.openConversation({
        sourceModule: "communication-center",
        idempotencyKey: command.idempotencyKey,
        mode: "DIRECT",
        tenantId: command.tenantId,
        typeKey: command.typeKey,
        subject: command.subject,
        replyMode: "ENABLED",
        actor: { type: "CUSTOMER", userId: command.userId },
        firstEntry: {
          body: command.body,
          attachments: command.attachments,
          idempotencyKey: `${command.idempotencyKey}:entry`,
        },
        workItem: {
          queueKey: "support",
          priority: "NORMAL",
          slaPolicyKey: "support-standard-v1",
        },
        contexts: command.siteId ? [{
          namespace: "sites",
          entityType: "site",
          entityId: command.siteId,
          relationKey: "related",
        }] : [],
      });
    },

    async replyAsCustomer(command: {
      conversationId: string;
      tenantId: string;
      userId: string;
      body: string;
      attachments: CommunicationAttachmentInput[];
      idempotencyKey: string;
    }) {
      const snapshot = await input.queries.getCustomerConversation({
        conversationId: command.conversationId,
        tenantId: command.tenantId,
        userId: command.userId,
      });
      assertReplyable(snapshot);
      return input.core.appendEntry({
        conversationId: snapshot.id,
        actor: { type: "CUSTOMER", userId: command.userId },
        body: command.body,
        attachments: command.attachments,
        idempotencyKey: command.idempotencyKey,
        expectedLastSequence: snapshot.lastSequence,
        expectedVersion: snapshot.version,
      });
    },

    async replyAsAdmin(command: {
      conversationId: string;
      adminUserId: string;
      body: string;
      internal: boolean;
      attachments: CommunicationAttachmentInput[];
      idempotencyKey: string;
    }) {
      const snapshot = await input.queries.getAdminConversation(command.conversationId);
      if (!snapshot) throw new Error("المحادثة غير موجودة.");
      if (!command.internal) assertReplyable(snapshot);
      return input.core.appendEntry({
        conversationId: snapshot.id,
        actor: { type: "ADMIN", adminUserId: command.adminUserId },
        body: command.body,
        attachments: command.attachments,
        kind: command.internal ? "INTERNAL_NOTE" : "MESSAGE",
        visibility: command.internal ? "ADMIN_ONLY" : "CUSTOMER_AND_ADMIN",
        idempotencyKey: command.idempotencyKey,
        expectedLastSequence: snapshot.lastSequence,
        expectedVersion: snapshot.version,
      });
    },

    async markCustomerRead(command: { conversationId: string; tenantId: string; userId: string }) {
      const snapshot = await input.queries.getCustomerConversation(command);
      if (!snapshot) throw new Error("المحادثة غير موجودة أو لا تملك صلاحية الوصول إليها.");
      if (snapshot.lastCustomerVisibleSequence === 0) return null;
      return input.core.markRead({
        conversationId: snapshot.id,
        reader: { type: "CUSTOMER", userId: command.userId },
        upToSequence: snapshot.lastCustomerVisibleSequence,
      });
    },

    async markAdminRead(command: { conversationId: string; adminUserId: string }) {
      const snapshot = await input.queries.getAdminConversation(command.conversationId);
      if (!snapshot) throw new Error("المحادثة غير موجودة.");
      if (snapshot.lastSequence === 0) return null;
      return input.core.markRead({
        conversationId: snapshot.id,
        reader: { type: "ADMIN", adminUserId: command.adminUserId },
        upToSequence: snapshot.lastSequence,
      });
    },

    async transitionAsAdmin(command: {
      conversationId: string;
      adminUserId: string;
      toStatus: CommunicationWorkItemStatus;
      reason?: string | null;
      idempotencyKey: string;
    }) {
      const snapshot = await input.queries.getAdminConversation(command.conversationId);
      if (!snapshot?.workItem) throw new Error("عنصر العمل غير موجود.");
      return input.core.transitionWorkItem({
        workItemId: snapshot.workItem.id,
        toStatus: command.toStatus,
        actor: { type: "ADMIN", adminUserId: command.adminUserId },
        reason: command.reason,
        idempotencyKey: command.idempotencyKey,
      });
    },

    async resolveAsCustomer(command: {
      conversationId: string;
      tenantId: string;
      userId: string;
      resolved: boolean;
      idempotencyKey: string;
    }) {
      const snapshot = await input.queries.getCustomerConversation({
        conversationId: command.conversationId,
        tenantId: command.tenantId,
        userId: command.userId,
      });
      if (!snapshot?.workItem) throw new Error("الطلب غير موجود أو لا تملك صلاحية الوصول إليه.");
      if (snapshot.workItem.status !== "RESOLVED") throw new Error("لا يمكن تأكيد الحل إلا بعد أن يضع الفريق الطلب في حالة تم الحل.");
      return input.core.transitionWorkItem({
        workItemId: snapshot.workItem.id,
        actor: { type: "CUSTOMER", userId: command.userId },
        toStatus: command.resolved ? "CLOSED" : "IN_PROGRESS",
        reason: command.resolved ? "customer_confirmed_resolution" : "customer_requested_reopen",
        idempotencyKey: command.idempotencyKey,
      });
    },

    async manageAsAdmin(command: {
      conversationId: string;
      adminUserId: string;
      change: ManageWorkItemInput["change"];
      reason?: string | null;
      idempotencyKey: string;
    }) {
      const snapshot = await input.queries.getAdminConversation(command.conversationId);
      if (!snapshot?.workItem) throw new Error("عنصر العمل غير موجود.");
      return input.core.manageWorkItem({
        workItemId: snapshot.workItem.id,
        actor: { type: "ADMIN", adminUserId: command.adminUserId },
        change: command.change,
        reason: command.reason ?? null,
        idempotencyKey: command.idempotencyKey,
      });
    },
  };
}
