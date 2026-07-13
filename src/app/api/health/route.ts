import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isGitHubBackupConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const responseBody: Record<string, unknown> = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    platform: process.platform,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;
    responseBody.database = { connected: true, latencyMs: dbLatency };

    const [lastBackup, lastRestore, failedBackups] = await Promise.all([
      prisma.backupJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true, metadata: true } }),
      prisma.restoreJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
      prisma.backupJob.count({ where: { status: "FAILED" } }),
    ]);
    const metadata = lastBackup?.metadata && typeof lastBackup.metadata === "object" && !Array.isArray(lastBackup.metadata)
      ? lastBackup.metadata as Record<string, unknown>
      : {};
    const backupHealthy = isGitHubBackupConfigured()
      && Boolean(lastBackup?.completedAt)
      && metadata.remoteVerified === true;
    responseBody.backup = {
      healthy: backupHealthy,
      storage: "github",
      lastBackupAt: lastBackup?.completedAt?.toISOString() ?? null,
      lastRestoreAt: lastRestore?.completedAt?.toISOString() ?? null,
      failedBackups,
      remoteVerified: metadata.remoteVerified === true,
    };

    if (!backupHealthy || dbLatency >= 5000) {
      responseBody.status = "degraded";
    }
  } catch (error) {
    responseBody.status = "degraded";
    responseBody.database = {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return NextResponse.json(responseBody);
}
