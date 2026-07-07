"use server";

import { prisma } from "@/lib/prisma";

export async function getErrorLogs(params?: {
  category?: string;
  level?: string;
  code?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params?.category) {
    where.category = params.category;
  }
  if (params?.level) {
    where.level = params.level;
  }
  if (params?.code) {
    where.code = { contains: params.code };
  }
  if (params?.search) {
    where.OR = [
      { message: { contains: params.search } },
      { code: { contains: params.search } },
      { requestId: { contains: params.search } },
      { userId: { contains: params.search } },
    ];
  }
  if (params?.from || params?.to) {
    const createdAt: Record<string, Date> = {};
    if (params.from) createdAt.gte = new Date(params.from);
    if (params.to) createdAt.lte = new Date(params.to);
    where.createdAt = createdAt;
  }

  const [entries, total] = await Promise.all([
    prisma.errorLog.findMany({
      where: where as Parameters<typeof prisma.errorLog.findMany>[0]["where"],
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.errorLog.count({ where: where as Parameters<typeof prisma.errorLog.count>[0]["where"] }),
  ]);

  return {
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString() ?? null,
      metadata: e.metadata as Record<string, unknown> | null,
    })),
    total,
    page,
    pageSize,
  };
}

export async function resolveError(id: string, note?: string) {
  await prisma.errorLog.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolutionNote: note ?? null,
    },
  });
}

export async function getErrorStats() {
  const [total, unresolved, byCategory] = await Promise.all([
    prisma.errorLog.count(),
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.errorLog.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  return {
    total,
    unresolved,
    byCategory: byCategory.map((c) => ({
      category: c.category,
      count: c._count,
    })),
  };
}
