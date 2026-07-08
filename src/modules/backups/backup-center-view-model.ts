import { createVerificationService } from "./backup-verification-service";
import { runBackupHealthCheck } from "./backup-startup-health";

export type HealthMetric = {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "success" | "danger" | "warning" | "default";
  tooltip?: string;
};

export type BackupCenterViewModel = {
  healthStatus: "healthy" | "warning" | "critical";
  healthMetrics: HealthMetric[];
  backupSummary: {
    total: number;
    valid: number;
    invalid: number;
    totalSizeBytes: number;
    storageUsedBytes: number;
    averageDurationMs: number;
    averageSizeBytes: number;
  };
  restoreSummary: {
    total: number;
    successful: number;
    failed: number;
    averageDurationMs: number;
  };
  schedulerStatus: {
    active: boolean;
    enabledCount: number;
  };
  storageStatus: {
    readable: boolean;
    writable: boolean;
    pgDumpAvailable: boolean;
    psqlAvailable: boolean;
    tarAvailable: boolean;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    status: string;
    timestamp: string;
    sizeBytes?: number;
    durationMs?: number;
  }>;
  issues: string[];
};

type BackupCenterDeps = {
  prisma: {
    backupJob: {
      findMany(input: unknown): Promise<unknown>;
      count(input: { where: { status: string; createdAt?: { gte: Date } } }): Promise<number>;
      aggregate(input: {
        _avg: { sizeBytes: true; durationMs: true };
        where: { status: string; createdAt?: { gte: Date } };
      }): Promise<{ _avg: { sizeBytes: number | null; durationMs: number | null } }>;
    };
    restoreJob: {
      findMany(input: unknown): Promise<unknown>;
      count(input: { where: { status: string } }): Promise<number>;
    };
    backupSettings: {
      findMany(input: unknown): Promise<unknown>;
    };
    $queryRaw(query: TemplateStringsArray): Promise<unknown>;
  };
  backupRoot: string;
};

export async function buildBackupCenterViewModel(
  deps: BackupCenterDeps
): Promise<BackupCenterViewModel> {
  const verification = createVerificationService();
  const healthCheck = await runBackupHealthCheck({
    prisma: deps.prisma as never,
    backupRoot: deps.backupRoot,
  });

  const verificationResults = await verification.verifyAllBackups(deps.backupRoot);

  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [jobCount30d, failedCount30d, avgStats] = await Promise.all([
    deps.prisma.backupJob.count({
      where: { status: "COMPLETED", createdAt: { gte: last30Days } },
    }),
    deps.prisma.backupJob.count({
      where: { status: "FAILED", createdAt: { gte: last30Days } },
    }),
    deps.prisma.backupJob.aggregate({
      _avg: { sizeBytes: true, durationMs: true },
      where: { status: "COMPLETED", createdAt: { gte: last30Days } },
    }),
  ]);

  const restoreSuccessCount = await deps.prisma.restoreJob
    .count({ where: { status: "COMPLETED" } })
    .catch(() => 0);
  const restoreFailedCount = await deps.prisma.restoreJob
    .count({ where: { status: "FAILED" } })
    .catch(() => 0);

  const enabledSettings = await deps.prisma.backupSettings
    .findMany({ where: { enabled: true } } as never)
    .then((r: unknown) => (r as Array<unknown>).length)
    .catch(() => 0);

  const recentJobs = await deps.prisma.backupJob
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        sizeBytes: true,
      },
    } as never)
    .then((r: unknown) =>
      (r as Array<Record<string, unknown>>).map((j) => ({
        id: j.id as string,
        type: j.type as string,
        status: j.status as string,
        timestamp: (j.createdAt as Date).toISOString(),
        sizeBytes: j.sizeBytes as number | undefined,
      }))
    )
    .catch(() => []);

  const totalJobs = verificationResults.total;
  const validJobs = verificationResults.valid;
  const invalidJobs = verificationResults.invalid;
  const totalSizeBytes = verificationResults.results.reduce(
    (sum, r) => sum + (r.sizes.databaseBytes || 0) + (r.sizes.uploadsBytes || 0) + (r.sizes.contentBytes || 0),
    0
  );

  const issues: string[] = [];
  if (invalidJobs > 0) issues.push(`${invalidJobs} corrupted backup(s) found`);
  if (!healthCheck.checks.storageWritable) issues.push("Storage is not writable");
  if (!healthCheck.checks.pgDumpAvailable) issues.push("pg_dump not available");
  if (!healthCheck.checks.psqlAvailable) issues.push("psql not available");
  if (!healthCheck.checks.tarAvailable) issues.push("tar not available");
  const lastBackupAgeHours = healthCheck.details.lastBackupAt
    ? (Date.now() - new Date(healthCheck.details.lastBackupAt).getTime()) / (1000 * 60 * 60)
    : null;
  if (lastBackupAgeHours !== null && lastBackupAgeHours > 48)
    issues.push(`No backup in ${Math.round(lastBackupAgeHours)}h`);
  if (totalJobs === 0) issues.push("No backups exist yet");
  if (jobCount30d === 0 && totalJobs > 0) issues.push("No successful backups in last 30 days");
  if (failedCount30d > jobCount30d && jobCount30d > 0)
    issues.push("Failure rate exceeds success rate in last 30 days");

  const healthMetrics: HealthMetric[] = [
    {
      label: "Total Backups",
      value: totalJobs,
      tone: totalJobs > 0 ? "success" : "default",
    },
    {
      label: "Valid",
      value: validJobs,
      tone: validJobs === totalJobs && totalJobs > 0 ? "success" : validJobs > 0 ? "warning" : "default",
    },
    {
      label: "Corrupted",
      value: invalidJobs,
      tone: invalidJobs === 0 ? "success" : "danger",
    },
    {
      label: "Success Rate (30d)",
      value: jobCount30d + failedCount30d > 0
        ? `${Math.round((jobCount30d / (jobCount30d + failedCount30d)) * 100)}%`
        : "N/A",
      tone: jobCount30d > 0 && failedCount30d === 0 ? "success" : failedCount30d > 0 ? "warning" : "default",
    },
    {
      label: "Restore Success Rate",
      value: restoreSuccessCount + restoreFailedCount > 0
        ? `${Math.round((restoreSuccessCount / (restoreSuccessCount + restoreFailedCount)) * 100)}%`
        : "N/A",
      tone: restoreFailedCount === 0 ? "success" : restoreSuccessCount > 0 ? "warning" : "default",
    },
    {
      label: "Avg Duration",
      value: avgStats._avg.durationMs
        ? `${Math.round(avgStats._avg.durationMs / 1000)}s`
        : "N/A",
      unit: "seconds",
      tone: "default",
    },
    {
      label: "Avg Size",
      value: avgStats._avg.sizeBytes
        ? formatBytes(avgStats._avg.sizeBytes)
        : "N/A",
      tone: "default",
    },
    {
      label: "Storage Used",
      value: formatBytes(healthCheck.details.storageUsedBytes),
      tone: healthCheck.details.storageUsedBytes > 0 ? "success" : "default",
    },
    {
      label: "Last Backup",
      value: healthCheck.details.lastBackupAt
        ? timeAgo(new Date(healthCheck.details.lastBackupAt))
        : "Never",
      tone: lastBackupAgeHours !== null
        ? lastBackupAgeHours > 48
          ? "danger"
          : lastBackupAgeHours > 24
            ? "warning"
            : "success"
        : "default",
    },
    {
      label: "Last Restore",
      value: healthCheck.details.lastRestoreAt
        ? timeAgo(new Date(healthCheck.details.lastRestoreAt))
        : "Never",
      tone: healthCheck.details.lastRestoreAt ? "success" : "default",
    },
    {
      label: "Scheduler",
      value: enabledSettings > 0 ? "Active" : "Inactive",
      tone: enabledSettings > 0 ? "success" : "warning",
    },
    {
      label: "pg_dump / psql / tar",
      value: [
        healthCheck.checks.pgDumpAvailable ? "pg_dump" : null,
        healthCheck.checks.psqlAvailable ? "psql" : null,
        healthCheck.checks.tarAvailable ? "tar" : null,
      ]
        .filter(Boolean)
        .join(" / ") || "None available",
      tone: healthCheck.checks.pgDumpAvailable && healthCheck.checks.psqlAvailable && healthCheck.checks.tarAvailable
        ? "success"
        : "danger",
    },
    {
      label: "DB Connection",
      value: healthCheck.checks.dbConnection ? "Connected" : "Disconnected",
      tone: healthCheck.checks.dbConnection ? "success" : "danger",
    },
    {
      label: "Storage",
      value: healthCheck.checks.storageReadable && healthCheck.checks.storageWritable
        ? "Read/Write"
        : "Degraded",
      tone: healthCheck.checks.storageReadable && healthCheck.checks.storageWritable
        ? "success"
        : "danger",
    },
  ];

  const criticalIssues = issues.filter(
    (i) =>
      i.includes("corrupted") ||
      i.includes("not available") ||
      i.includes("not writable") ||
      i.includes("Disconnected")
  );

  return {
    healthStatus: criticalIssues.length > 0 ? "critical" : issues.length > 0 ? "warning" : "healthy",
    healthMetrics,
    backupSummary: {
      total: totalJobs,
      valid: validJobs,
      invalid: invalidJobs,
      totalSizeBytes,
      storageUsedBytes: healthCheck.details.storageUsedBytes,
      averageDurationMs: avgStats._avg.durationMs ?? 0,
      averageSizeBytes: avgStats._avg.sizeBytes ?? 0,
    },
    restoreSummary: {
      total: restoreSuccessCount + restoreFailedCount,
      successful: restoreSuccessCount,
      failed: restoreFailedCount,
      averageDurationMs: 0,
    },
    schedulerStatus: {
      active: enabledSettings > 0,
      enabledCount: enabledSettings,
    },
    storageStatus: {
      readable: healthCheck.checks.storageReadable,
      writable: healthCheck.checks.storageWritable,
      pgDumpAvailable: healthCheck.checks.pgDumpAvailable,
      psqlAvailable: healthCheck.checks.psqlAvailable,
      tarAvailable: healthCheck.checks.tarAvailable,
    },
    recentActivity: recentJobs,
    issues,
  };
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
