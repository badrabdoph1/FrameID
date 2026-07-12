import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = {
      OR: [
        { action: { contains: "BACKUP" } },
        { action: { contains: "RESTORE" } },
        { action: { contains: "SCHEDULER" } },
      ],
    };

    if (type) {
      where.OR = [
        { metadata: { path: ["type"], equals: type } },
        { action: { contains: type } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const backupJobs = await prisma.backupJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        status: true,
        sizeBytes: true,
        checksumSha256: true,
        filePath: true,
        errorMessage: true,
        metadata: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
      jobs: backupJobs.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        sizeBytes: j.sizeBytes,
        hasChecksum: Boolean(j.checksumSha256),
        localPath: j.filePath,
        errorMessage: j.errorMessage,
        metadata: j.metadata,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString() ?? null,
      })),
      total: { logs: logs.length, jobs: backupJobs.length },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
