"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export async function getNotificationLogs(params?: {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireSuperAdminSession();

  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { deletedAt: null };
  if (params?.type) where.type = params.type;
  if (params?.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { body: { contains: params.search, mode: "insensitive" } },
      { category: { contains: params.search, mode: "insensitive" } },
      { userId: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: where as Prisma.NotificationLogWhereInput,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notificationLog.count({ where: where as Prisma.NotificationLogWhereInput }),
  ]);

  return {
    entries: entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      readAt: entry.readAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getNotificationStats() {
  await requireSuperAdminSession();

  const [total, unread, byType] = await Promise.all([
    prisma.notificationLog.count({ where: { deletedAt: null } }),
    prisma.notificationLog.count({ where: { readAt: null, deletedAt: null } }),
    prisma.notificationLog.groupBy({
      by: ["type"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { type: "desc" } },
    }),
  ]);

  return {
    total,
    unread,
    byType: byType.map((item) => ({ type: item.type, count: item._count })),
  };
}
