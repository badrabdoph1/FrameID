import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBackupHealthCheck } from "@/modules/backups/backup-startup-health";
import { join } from "node:path";

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

    const backupRoot = join(process.cwd(), "backups");
    const backupHealth = await runBackupHealthCheck({
      prisma: prisma as never,
      backupRoot,
    }).catch(() => null);

    if (backupHealth) {
      responseBody.backup = {
        healthy: backupHealth.healthy,
        totalBackups: backupHealth.details.totalBackups,
        lastBackupAt: backupHealth.details.lastBackupAt,
        lastRestoreAt: backupHealth.details.lastRestoreAt,
        corruptedCount: backupHealth.details.corruptedCount,
        storageUsedBytes: backupHealth.details.storageUsedBytes,
        issues: backupHealth.issues,
      };
      responseBody.tools = {
        pgDump: backupHealth.checks.pgDumpAvailable,
        psql: backupHealth.checks.psqlAvailable,
        tar: backupHealth.checks.tarAvailable,
      };
    }

    if (!backupHealth || !backupHealth.healthy || dbLatency >= 5000) {
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
