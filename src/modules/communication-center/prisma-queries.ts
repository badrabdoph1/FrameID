import type {
  CommunicationPriority,
  CommunicationWorkItemStatus,
  PrismaClient,
} from "@prisma/client";

import {
  buildAdminInboxWhere,
  buildCustomerConversationWhere,
  buildCustomerInboxWhere,
  customerTimelineEntryWhere,
  type AdminInboxFilters,
} from "./query-contract";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

export type CommunicationInboxItem = {
  id: string;
  number: number;
  mode: "DIRECT" | "BROADCAST";
  typeKey: string;
  subject: string;
  replyMode: "ENABLED" | "DISABLED" | "PRIVATE_BRANCH";
  lastActivityAt: Date;
  lastEntry: {
    body: string | null;
    kind: string;
    authorType: string;
    createdAt: Date;
  } | null;
  unread: boolean;
  unreadCount: number;
  status: CommunicationWorkItemStatus | null;
  priority: CommunicationPriority | null;
};

export type CustomerConversationDetail = {
  id: string;
  number: number;
  mode: "DIRECT" | "BROADCAST";
  typeKey: string;
  subject: string;
  replyMode: "ENABLED" | "DISABLED" | "PRIVATE_BRANCH";
  lifecycleState: string;
  lastSequence: number;
  lastCustomerVisibleSequence: number;
  version: number;
  lastReadSequence: number;
  counterpartyLastReadSequence: number;
  workItem: null | {
    id: string;
    status: CommunicationWorkItemStatus;
    priority: CommunicationPriority;
  };
  entries: CommunicationTimelineEntry[];
};

export type CommunicationTimelineEntry = {
  id: string;
  sequence: number;
  kind: string;
  visibility: string;
  authorType: string;
  authorName: string;
  body: string | null;
  eventName: string | null;
  metadata: unknown;
  createdAt: Date;
  attachments: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    scanStatus: string;
  }>;
};

export type AdminInboxItem = CommunicationInboxItem & {
  tenantId: string | null;
  customerName: string;
  customerEmail: string | null;
  queueKey: string | null;
  assigneeAdminUserId: string | null;
  waitingSince: Date | null;
};

export type AdminConversationDetail = Omit<CustomerConversationDetail, "lastReadSequence"> & {
  tenant: null | {
    id: string;
    displayName: string;
    ownerName: string;
    ownerEmail: string;
  };
  workItem: null | {
    id: string;
    status: CommunicationWorkItemStatus;
    priority: CommunicationPriority;
    queueKey: string;
    assigneeAdminUserId: string | null;
    assigneeName: string | null;
    version: number;
    firstResponseAt: Date | null;
    resolvedAt: Date | null;
    waitingSince: Date | null;
  };
  contexts: Array<{
    id: string;
    namespace: string;
    entityType: string;
    entityId: string;
    relationKey: string;
  }>;
};

function pageSize(value?: number): number {
  if (!value || !Number.isSafeInteger(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(value, 1), MAX_PAGE_SIZE);
}

function cursorPosition(value?: string | null): { date: Date; id: string | null } | null {
  if (!value) return null;
  const separator = value.lastIndexOf("|");
  const dateValue = separator === -1 ? value : value.slice(0, separator);
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : { date: parsed, id: separator === -1 ? null : value.slice(separator + 1) };
}

function cursorWhere(cursor: { date: Date; id: string | null } | null) {
  if (!cursor) return {};
  if (!cursor.id) return { lastActivityAt: { lt: cursor.date } };
  return { OR: [{ lastActivityAt: { lt: cursor.date } }, { lastActivityAt: cursor.date, id: { lt: cursor.id } }] };
}

function authorName(entry: {
  authorType: string;
  authorUser?: { name: string } | null;
  authorAdmin?: { name: string } | null;
  authorSystemKey?: string | null;
}): string {
  if (entry.authorType === "CUSTOMER") return entry.authorUser?.name || "العميل";
  if (entry.authorType === "ADMIN") return entry.authorAdmin?.name || "فريق FrameID";
  return entry.authorSystemKey || "النظام";
}

type TimelineAttachmentRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  scanStatus: string;
};

type TimelineEntryRow = {
  id: string;
  sequence: number;
  kind: string;
  visibility: string;
  authorType: string;
  authorSystemKey: string | null;
  authorUser: { name: string } | null;
  authorAdmin: { name: string } | null;
  body: string | null;
  eventName: string | null;
  metadata: unknown;
  createdAt: Date;
  attachments: TimelineAttachmentRow[];
};

function mapTimelineEntry(entry: TimelineEntryRow): CommunicationTimelineEntry {
  return {
    id: entry.id,
    sequence: entry.sequence,
    kind: entry.kind,
    visibility: entry.visibility,
    authorType: entry.authorType,
    authorName: authorName(entry),
    body: entry.body,
    eventName: entry.eventName,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
    attachments: entry.attachments.map((attachment) => ({
      id: attachment.id,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      width: attachment.width,
      height: attachment.height,
      scanStatus: attachment.scanStatus,
    })),
  };
}

const customerEntrySelect = {
  id: true,
  sequence: true,
  kind: true,
  visibility: true,
  authorType: true,
  authorSystemKey: true,
  body: true,
  eventName: true,
  metadata: true,
  createdAt: true,
  authorUser: { select: { name: true } },
  authorAdmin: { select: { name: true } },
  attachments: {
    where: { deletedAt: null },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      width: true,
      height: true,
      scanStatus: true,
    },
  },
} as const;

export function createPrismaCommunicationCenterQueries(prisma: PrismaClient) {
  return {
    async listCustomerInbox(input: {
      tenantId: string;
      userId: string;
      limit?: number;
      cursor?: string | null;
    }) {
      const limit = pageSize(input.limit);
      const before = cursorPosition(input.cursor);
      const conversations = await prisma.communicationConversation.findMany({
        where: {
          lifecycleState: "ACTIVE",
          audiences: {
            some: buildCustomerInboxWhere(input.tenantId),
          },
          ...cursorWhere(before),
        },
        orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: {
          id: true,
          number: true,
          mode: true,
          typeKey: true,
          subject: true,
          replyMode: true,
          lastActivityAt: true,
          lastCustomerVisibleSequence: true,
          audiences: {
            where: { tenantId: input.tenantId },
            select: { lastCustomerVisibleSequence: true },
            take: 1,
          },
          readCursors: {
            where: { userId: input.userId },
            select: { lastReadSequence: true },
            take: 1,
          },
          workItem: { select: { status: true, priority: true } },
          entries: {
            where: customerTimelineEntryWhere(),
            orderBy: { sequence: "desc" },
            take: 1,
            select: { body: true, kind: true, authorType: true, createdAt: true },
          },
        },
      });
      const hasMore = conversations.length > limit;
      const visible = conversations.slice(0, limit);
      const items: CommunicationInboxItem[] = visible.map((conversation) => {
        const visibleSequence = conversation.audiences[0]?.lastCustomerVisibleSequence
          ?? conversation.lastCustomerVisibleSequence;
        const readSequence = conversation.readCursors[0]?.lastReadSequence ?? 0;
        return {
          id: conversation.id,
          number: conversation.number,
          mode: conversation.mode,
          typeKey: conversation.typeKey,
          subject: conversation.subject,
          replyMode: conversation.replyMode,
          lastActivityAt: conversation.lastActivityAt,
          lastEntry: conversation.entries[0] ?? null,
          unread: visibleSequence > readSequence,
          unreadCount: visibleSequence > readSequence ? 1 : 0,
          status: conversation.workItem?.status ?? null,
          priority: conversation.workItem?.priority ?? null,
        };
      });
      return {
        items,
        nextCursor: hasMore && visible.at(-1) ? `${visible.at(-1)!.lastActivityAt.toISOString()}|${visible.at(-1)!.id}` : null,
      };
    },

    async getCustomerConversation(input: {
      conversationId: string;
      tenantId: string;
      userId: string;
    }): Promise<CustomerConversationDetail | null> {
      const conversation = await prisma.communicationConversation.findFirst({
        where: buildCustomerConversationWhere(input.conversationId, input.tenantId),
        select: {
          id: true,
          number: true,
          mode: true,
          typeKey: true,
          subject: true,
          replyMode: true,
          lifecycleState: true,
          lastSequence: true,
          lastCustomerVisibleSequence: true,
          version: true,
          readCursors: {
            select: { userId: true, adminUserId: true, lastReadSequence: true },
          },
          workItem: { select: { id: true, status: true, priority: true } },
          entries: {
            where: customerTimelineEntryWhere(),
            orderBy: { sequence: "asc" },
            select: customerEntrySelect,
          },
        },
      });
      if (!conversation) return null;
      return {
        ...conversation,
        lastReadSequence: conversation.readCursors.find((cursor) => cursor.userId === input.userId)?.lastReadSequence ?? 0,
        counterpartyLastReadSequence: Math.max(0, ...conversation.readCursors.filter((cursor) => cursor.adminUserId).map((cursor) => cursor.lastReadSequence)),
        entries: conversation.entries.map(mapTimelineEntry),
      };
    },

    async getCustomerUnreadCount(tenantId: string, userId: string): Promise<number> {
      const audiences = await prisma.communicationAudience.findMany({
        where: buildCustomerInboxWhere(tenantId),
        select: {
          lastCustomerVisibleSequence: true,
          conversation: {
            select: {
              readCursors: {
                where: { userId },
                select: { lastReadSequence: true },
                take: 1,
              },
            },
          },
        },
      });
      return audiences.reduce((count, audience) => {
        const read = audience.conversation.readCursors[0]?.lastReadSequence ?? 0;
        return count + (audience.lastCustomerVisibleSequence > read ? 1 : 0);
      }, 0);
    },

    async listAdminInbox(filters: AdminInboxFilters & {
      adminUserId?: string | null;
      limit?: number;
      cursor?: string | null;
    }) {
      const limit = pageSize(filters.limit);
      const before = cursorPosition(filters.cursor);
      const where = {
        ...buildAdminInboxWhere(filters),
        ...cursorWhere(before),
      };
      const [conversations, total] = await Promise.all([
        prisma.communicationConversation.findMany({
          where,
          orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
          take: limit + 1,
          select: {
            id: true,
            number: true,
            mode: true,
            typeKey: true,
            subject: true,
            replyMode: true,
            lastActivityAt: true,
            lastSequence: true,
            tenantId: true,
            tenant: { select: { displayName: true, owner: { select: { name: true, email: true } } } },
            readCursors: filters.adminUserId ? {
              where: { adminUserId: filters.adminUserId },
              select: { lastReadSequence: true },
              take: 1,
            } : false,
            workItem: {
              select: {
                status: true,
                priority: true,
                queueKey: true,
                assigneeAdminUserId: true,
                waitingSince: true,
              },
            },
            entries: {
              where: { redactedAt: null },
              orderBy: { sequence: "desc" },
              take: 1,
              select: { body: true, kind: true, authorType: true, createdAt: true },
            },
          },
        }),
        prisma.communicationConversation.count({ where }),
      ]);
      const hasMore = conversations.length > limit;
      const visible = conversations.slice(0, limit);
      const items: AdminInboxItem[] = visible.map((conversation) => {
        const readSequence = Array.isArray(conversation.readCursors)
          ? conversation.readCursors[0]?.lastReadSequence ?? 0
          : 0;
        return {
          id: conversation.id,
          number: conversation.number,
          mode: conversation.mode,
          typeKey: conversation.typeKey,
          subject: conversation.subject,
          replyMode: conversation.replyMode,
          lastActivityAt: conversation.lastActivityAt,
          lastEntry: conversation.entries[0] ?? null,
          unread: conversation.lastSequence > readSequence,
          unreadCount: conversation.lastSequence > readSequence ? 1 : 0,
          status: conversation.workItem?.status ?? null,
          priority: conversation.workItem?.priority ?? null,
          tenantId: conversation.tenantId,
          customerName: conversation.tenant?.displayName || conversation.tenant?.owner.name || "بدون عميل",
          customerEmail: conversation.tenant?.owner.email ?? null,
          queueKey: conversation.workItem?.queueKey ?? null,
          assigneeAdminUserId: conversation.workItem?.assigneeAdminUserId ?? null,
          waitingSince: conversation.workItem?.waitingSince ?? null,
        };
      });
      return {
        items,
        total,
        nextCursor: hasMore && visible.at(-1) ? `${visible.at(-1)!.lastActivityAt.toISOString()}|${visible.at(-1)!.id}` : null,
      };
    },

    async getAdminConversation(conversationId: string): Promise<AdminConversationDetail | null> {
      const conversation = await prisma.communicationConversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          number: true,
          mode: true,
          typeKey: true,
          subject: true,
          replyMode: true,
          lifecycleState: true,
          lastSequence: true,
          lastCustomerVisibleSequence: true,
          version: true,
          readCursors: { select: { userId: true, lastReadSequence: true } },
          tenant: { select: { id: true, displayName: true, owner: { select: { name: true, email: true } } } },
          workItem: {
            select: {
              id: true,
              status: true,
              priority: true,
              queueKey: true,
              assigneeAdminUserId: true,
              assignee: { select: { name: true } },
              version: true,
              firstResponseAt: true,
              resolvedAt: true,
              waitingSince: true,
            },
          },
          contextReferences: {
            orderBy: { createdAt: "asc" },
            select: { id: true, namespace: true, entityType: true, entityId: true, relationKey: true },
          },
          entries: {
            where: { redactedAt: null },
            orderBy: { sequence: "asc" },
            select: customerEntrySelect,
          },
        },
      });
      if (!conversation) return null;
      return {
        id: conversation.id,
        number: conversation.number,
        mode: conversation.mode,
        typeKey: conversation.typeKey,
        subject: conversation.subject,
        replyMode: conversation.replyMode,
        lifecycleState: conversation.lifecycleState,
        lastSequence: conversation.lastSequence,
        lastCustomerVisibleSequence: conversation.lastCustomerVisibleSequence,
        version: conversation.version,
        counterpartyLastReadSequence: Math.max(0, ...conversation.readCursors.filter((cursor) => cursor.userId).map((cursor) => cursor.lastReadSequence)),
        tenant: conversation.tenant ? {
          id: conversation.tenant.id,
          displayName: conversation.tenant.displayName,
          ownerName: conversation.tenant.owner.name,
          ownerEmail: conversation.tenant.owner.email,
        } : null,
        workItem: conversation.workItem ? {
          id: conversation.workItem.id,
          status: conversation.workItem.status,
          priority: conversation.workItem.priority,
          queueKey: conversation.workItem.queueKey,
          assigneeAdminUserId: conversation.workItem.assigneeAdminUserId,
          assigneeName: conversation.workItem.assignee?.name ?? null,
          version: conversation.workItem.version,
          firstResponseAt: conversation.workItem.firstResponseAt,
          resolvedAt: conversation.workItem.resolvedAt,
          waitingSince: conversation.workItem.waitingSince,
        } : null,
        contexts: conversation.contextReferences,
        entries: conversation.entries.map(mapTimelineEntry),
      };
    },
  };
}
