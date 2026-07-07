"use server";

import { prisma } from "@/lib/prisma";

export async function getNotificationLogs(params?: {
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params?.type) {
    where.type = params.type;
  }

  const [entries, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: where as Parameters<typeof prisma.notificationLog.findMany>[0]["where"],
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notificationLog.count({ where: where as Parameters<typeof prisma.notificationLog.count>[0]["where"] }),
  ]);

  return {
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      readAt: e.readAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
  };
}
