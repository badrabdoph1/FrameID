import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createVerificationService } from "./backup-verification-service";

export type HealthCheckResult = {
  healthy: boolean;
  checks: {
    lastBackupExists: boolean;
    lastBackupAgeHours: number | null;
    lastRestoreExists: boolean;
    lastRestoreAgeHours: number | null;
    lastVerificationExists: boolean;
    lastVerificationAgeHours: number | null;
    storageReadable: boolean;
    storageWritable: boolean;
    schedulerActive: boolean;
    corruptedBackups: string[];
    overdueBackups: string[];
    dbConnection: boolean;
    pgDumpAvailable: boolean;
    psqlAvailable: boolean;
    tarAvailable: boolean;
  };
  details: {
    totalBackups: number;
    storageUsedBytes: number;
    lastBackupId: string | null;
    lastBackupAt: string | null;
    lastRestoreAt: string | null;
    lastVerificationAt: string | null;
    corruptedCount: number;
    overdueCount: number;
  };
  issues: string[];
  timestamp: string;
};

type HealthDeps = {
  prisma: {
    backupJob: {
      findFirst(input: {
        orderBy: { createdAt: "desc" };
        select: { id: true; createdAt: true; type: true; status: true };
      }): Promise<{ id: string; createdAt: Date; type: string; status: string } | null>;
      count(input: { where: { status: string } }): Promise<number>;
    };
    restoreJob: {
      findFirst(input: {
        orderBy: { createdAt: "desc" };
        select: { id: true; createdAt: true; status: true };
      }): Promise<{ id: string; createdAt: Date; status: string } | null>;
      count(input: { where: { status: string } }): Promise<number>;
    };
    backupSettings: {
      count(input: { where: { enabled: boolean } }): Promise<number>;
    };
    $queryRaw(query: TemplateStringsArray): Promise<unknown>;
  };
  backupRoot: string;
};

async function checkTool(tool: string): Promise<boolean> {
  const { execSync } = await import("node:child_process");
  try {
    execSync(`which ${tool}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function getStorageSize(dir: string): Promise<number> {
  if (!existsSync(dir)) return 0;
  try {
    const { execSync } = await import("node:child_process");
    const result = execSync(`du -sb "${dir}" 2>/dev/null || echo 0`, {
      encoding: "utf-8",
    });
    return parseInt(result.split("\t")[0], 10) || 0;
  } catch {
    return 0;
  }
}

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

export async function runBackupHealthCheck(
  deps: HealthDeps
): Promise<HealthCheckResult> {
  const issues: string[] = [];
  const corruptedBackups: string[] = [];
  const overdueBackups: string[] = [];
  const now = new Date();

  const verification = createVerificationService();
  const backupRoot = deps.backupRoot;

  const lastJob = await deps.prisma.backupJob.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, type: true, status: true },
  });
  const lastRestore = await deps.prisma.restoreJob.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, status: true },
  });

  let dbOk = false;
  try {
    await deps.prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    issues.push("Database connection failed");
  }

  const [pgDumpOk, psqlOk, tarOk] = await Promise.all([
    checkTool("pg_dump"),
    checkTool("psql"),
    checkTool("tar"),
  ]);

  if (!pgDumpOk) issues.push("pg_dump not found on PATH");
  if (!psqlOk) issues.push("psql not found on PATH");
  if (!tarOk) issues.push("tar not found on PATH");

  const storageReadable = existsSync(backupRoot);
  const storageWritable = (() => {
    try {
      const testFile = join(backupRoot, `.health-${Date.now()}`);
      writeFileSync(testFile, "ok");
      unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  })();

  if (!storageReadable) issues.push("Backup storage directory not readable");
  if (!storageWritable) issues.push("Backup storage directory not writable");

  let totalBackups = 0;
  if (existsSync(backupRoot)) {
    try {
      const entries = await readdir(backupRoot);
      for (const entry of entries) {
        const fullPath = join(backupRoot, entry);
        const s = await stat(fullPath).catch(() => null);
        if (s?.isDirectory()) totalBackups++;
      }
    } catch {}
  }

  const storageSize = await getStorageSize(backupRoot);

  if (totalBackups > 0) {
    const verificationResult = await verification.verifyAllBackups(backupRoot);
    for (const result of verificationResult.results) {
      if (!result.valid) {
        corruptedBackups.push(`Backup validation failed`);
      }
    }
  }

  const enabledSettings = await deps.prisma.backupSettings
    .count({ where: { enabled: true } })
    .catch(() => 0);

  const schedulerActive = enabledSettings > 0;

  let lastVerificationAt: string | null = null;
  try {
    const lastAudit = await deps.prisma.backupJob.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, type: true, status: true },
    });
    if (lastAudit) {
      lastVerificationAt = lastAudit.createdAt.toISOString();
    }
  } catch {}

  const lastBackupExists = lastJob !== null;
  const lastBackupAgeHours = lastJob ? hoursSince(lastJob.createdAt) : null;
  const lastRestoreExists = lastRestore !== null;
  const lastRestoreAgeHours = lastRestore ? hoursSince(lastRestore.createdAt) : null;

  if (lastBackupAgeHours !== null && lastBackupAgeHours > 48) {
    issues.push(
      `No backup in ${Math.round(lastBackupAgeHours)} hours (last: ${lastJob?.id})`
    );
  }

  if (corruptedBackups.length > 0) {
    issues.push(
      `${corruptedBackups.length} corrupted backup(s) detected`
    );
  }

  return {
    healthy: issues.length === 0,
    checks: {
      lastBackupExists,
      lastBackupAgeHours,
      lastRestoreExists,
      lastRestoreAgeHours,
      lastVerificationExists: lastVerificationAt !== null,
      lastVerificationAgeHours: lastVerificationAt
        ? hoursSince(new Date(lastVerificationAt))
        : null,
      storageReadable,
      storageWritable,
      schedulerActive,
      corruptedBackups,
      overdueBackups,
      dbConnection: dbOk,
      pgDumpAvailable: pgDumpOk,
      psqlAvailable: psqlOk,
      tarAvailable: tarOk,
    },
    details: {
      totalBackups,
      storageUsedBytes: storageSize,
      lastBackupId: lastJob?.id ?? null,
      lastBackupAt: lastJob?.createdAt.toISOString() ?? null,
      lastRestoreAt: lastRestore?.createdAt.toISOString() ?? null,
      lastVerificationAt,
      corruptedCount: corruptedBackups.length,
      overdueCount: overdueBackups.length,
    },
    issues,
    timestamp: now.toISOString(),
  };
}
