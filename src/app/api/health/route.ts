import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runBackupHealthCheck } from "@/modules/backups/backup-startup-health";
import { join } from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    const backupRoot = join(process.cwd(), "backups");
    const backupHealth = await runBackupHealthCheck({
      prisma: prisma as never,
      backupRoot,
    });

    const overallStatus = dbLatency < 5000 && backupHealth.healthy ? "healthy" : "degraded";

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latencyMs: dbLatency,
      },
      backup: {
        healthy: backupHealth.healthy,
        totalBackups: backupHealth.details.totalBackups,
        lastBackupAt: backupHealth.details.lastBackupAt,
        lastRestoreAt: backupHealth.details.lastRestoreAt,
        corruptedCount: backupHealth.details.corruptedCount,
        storageUsedBytes: backupHealth.details.storageUsedBytes,
        issues: backupHealth.issues,
      },
      tools: {
        pgDump: backupHealth.checks.pgDumpAvailable,
        psql: backupHealth.checks.psqlAvailable,
        tar: backupHealth.checks.tarAvailable,
      },
      memory: process.memoryUsage(),
      node: process.version,
      platform: process.platform,
    });
  } catch (error) {
    const dbLatency = Date.now() - start;

    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: false,
          latencyMs: dbLatency,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 503 }
    );
  }
}
