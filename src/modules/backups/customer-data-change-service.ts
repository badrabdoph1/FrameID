import { prisma } from "@/lib/prisma";

export type CustomerDataChangeEntry = {
  id: string;
  entityType: string;
  entityId: string;
  tenantId?: string | null;
  siteId?: string | null;
  userId?: string | null;
  action: string;
  before: unknown;
  after: unknown;
  changedBy?: string | null;
  changedByName?: string | null;
  source: string;
  createdAt: string;
};

export async function logCustomerDataChange(input: {
  entityType: string;
  entityId: string;
  tenantId?: string | null;
  siteId?: string | null;
  userId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  changedBy?: string | null;
  changedByName?: string | null;
  source?: string;
}): Promise<void> {
  await prisma.customerDataChange.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      tenantId: input.tenantId ?? null,
      siteId: input.siteId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      before: (input.before ?? null) as never,
      after: (input.after ?? null) as never,
      changedBy: input.changedBy ?? null,
      changedByName: input.changedByName ?? null,
      source: input.source ?? "customer",
    },
  });
}

export async function getCustomerDataChanges(options: {
  entityType?: string;
  entityId?: string;
  tenantId?: string;
  siteId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ entries: CustomerDataChangeEntry[]; total: number }> {
  const where: Record<string, unknown> = {};
  if (options.entityType) where.entityType = options.entityType;
  if (options.entityId) where.entityId = options.entityId;
  if (options.tenantId) where.tenantId = options.tenantId;
  if (options.siteId) where.siteId = options.siteId;

  const [rows, total] = await Promise.all([
    prisma.customerDataChange.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    }),
    prisma.customerDataChange.count({ where }),
  ]);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      tenantId: r.tenantId,
      siteId: r.siteId,
      userId: r.userId,
      action: r.action,
      before: r.before,
      after: r.after,
      changedBy: r.changedBy,
      changedByName: r.changedByName,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
  };
}
