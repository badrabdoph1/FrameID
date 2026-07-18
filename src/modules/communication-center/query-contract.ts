import type {
  CommunicationPriority,
  CommunicationWorkItemStatus,
  Prisma,
} from "@prisma/client";

export type AdminInboxFilters = {
  search?: string | null;
  status?: CommunicationWorkItemStatus | null;
  priority?: CommunicationPriority | null;
  queueKey?: string | null;
  assigneeAdminUserId?: string | null;
  typeKey?: string | null;
};

function requiredId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} مطلوب.`);
  return normalized;
}

function optionalStableKey(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

export function buildCustomerInboxWhere(tenantId: string): Prisma.CommunicationAudienceWhereInput {
  return {
    tenantId: requiredId(tenantId, "tenantId"),
    deliveredAt: { not: null },
    archivedAt: null,
    withdrawnAt: null,
    conversation: { lifecycleState: "ACTIVE" },
  };
}

export function buildCustomerConversationWhere(
  conversationId: string,
  tenantId: string,
): Prisma.CommunicationConversationWhereInput {
  return {
    id: requiredId(conversationId, "conversationId"),
    audiences: {
      some: {
        tenantId: requiredId(tenantId, "tenantId"),
        deliveredAt: { not: null },
        archivedAt: null,
        withdrawnAt: null,
      },
    },
  };
}

export function customerTimelineEntryWhere(): Prisma.CommunicationEntryWhereInput {
  return { visibility: "CUSTOMER_AND_ADMIN", redactedAt: null };
}

export function buildAdminInboxWhere(
  filters: AdminInboxFilters = {},
): Prisma.CommunicationConversationWhereInput {
  const where: Prisma.CommunicationConversationWhereInput = { mode: "DIRECT" };
  const search = filters.search?.trim();

  if (search) {
    const number = Number(search);
    if (/^\d+$/.test(search) && Number.isSafeInteger(number)) {
      where.number = number;
    } else {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { tenant: { displayName: { contains: search, mode: "insensitive" } } },
        { tenant: { owner: { name: { contains: search, mode: "insensitive" } } } },
        { tenant: { owner: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }
  }

  const workItem: Prisma.CommunicationWorkItemWhereInput = {};
  if (filters.status) workItem.status = filters.status;
  if (filters.priority) workItem.priority = filters.priority;
  const queueKey = optionalStableKey(filters.queueKey);
  if (queueKey) workItem.queueKey = queueKey;
  if (filters.assigneeAdminUserId?.trim()) {
    workItem.assigneeAdminUserId = filters.assigneeAdminUserId.trim();
  }
  if (Object.keys(workItem).length > 0) where.workItem = workItem;

  const typeKey = optionalStableKey(filters.typeKey);
  if (typeKey) where.typeKey = typeKey;
  return where;
}
