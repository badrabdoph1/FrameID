"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

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
  await requireSuperAdminSession();

  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params?.category) where.category = params.category;
  if (params?.level) where.level = params.level;
  if (params?.code) where.code = { contains: params.code };
  if (params?.search) {
    where.OR = [
      { message: { contains: params.search, mode: "insensitive" } },
      { code: { contains: params.search, mode: "insensitive" } },
      { requestId: { contains: params.search, mode: "insensitive" } },
      { correlationId: { contains: params.search, mode: "insensitive" } },
      { route: { contains: params.search, mode: "insensitive" } },
      { userId: { contains: params.search, mode: "insensitive" } },
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
      where: where as Prisma.ErrorLogWhereInput,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.errorLog.count({ where: where as Prisma.ErrorLogWhereInput }),
  ]);

  return {
    entries: entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      resolvedAt: entry.resolvedAt?.toISOString() ?? null,
      metadata: entry.metadata as Record<string, unknown> | null,
    })),
    total,
    page,
    pageSize,
  };
}

export async function resolveError(id: string, note?: string) {
  const session = await requireSuperAdminSession();

  await prisma.errorLog.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
      resolutionNote: note ?? "تم الحل من مركز الأخطاء",
    },
  });
}

export async function getErrorStats() {
  await requireSuperAdminSession();

  const [total, unresolved, byCategory, byLevel] = await Promise.all([
    prisma.errorLog.count(),
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.errorLog.groupBy({
      by: ["category"],
      _count: true,
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.errorLog.groupBy({
      by: ["level"],
      _count: true,
      orderBy: { _count: { level: "desc" } },
    }),
  ]);

  return {
    total,
    unresolved,
    byCategory: byCategory.map((category) => ({
      category: category.category,
      count: category._count,
    })),
    byLevel: byLevel.map((level) => ({
      level: level.level,
      count: level._count,
    })),
  };
}
