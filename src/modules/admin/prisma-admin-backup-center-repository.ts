type PrismaAdminBackupCenterClient = {
  backupSettings: {
    findMany(input: unknown): Promise<unknown>;
  };
  backupJob: {
    findMany(input: unknown): Promise<unknown>;
  };
  restoreJob: {
    findMany(input: unknown): Promise<unknown>;
    count(input: unknown): Promise<number>;
  };
};

type RawBackupSetting = {
  type: string;
  enabled: boolean;
  schedule: string;
  retentionCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
};

type RawBackupJob = {
  id: string;
  type: string;
  status: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  filePath: string | null;
  errorMessage: string | null;
  metadata: unknown;
  createdAt: Date;
  completedAt: Date | null;
};

type RawRestoreJob = {
  id: string;
  backupJobId: string;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

function readTrigger(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "UNKNOWN";
  const trigger = (metadata as Record<string, unknown>).trigger;
  return typeof trigger === "string" ? trigger : "UNKNOWN";
}

export function createPrismaAdminBackupCenterRepository(
  prisma: PrismaAdminBackupCenterClient
) {
  return {
    async getBackupCenter() {
      const [settings, jobs, restores, restoreCount] = await Promise.all([
        prisma.backupSettings.findMany({
          orderBy: { type: "asc" },
          select: {
            type: true,
            enabled: true,
            schedule: true,
            retentionCount: true,
            lastRunAt: true,
            nextRunAt: true,
          },
        }) as Promise<RawBackupSetting[]>,
        prisma.backupJob.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
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
        }) as Promise<RawBackupJob[]>,
        prisma.restoreJob.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            backupJobId: true,
            status: true,
            errorMessage: true,
            createdAt: true,
            completedAt: true,
          },
        }) as Promise<RawRestoreJob[]>,
        prisma.restoreJob.count({}) as Promise<number>,
      ]);

      const jobTypeById = new Map(jobs.map((job) => [job.id, job.type]));

      return {
        settings,
        jobs: jobs.map((job) => ({
          id: job.id,
          type: job.type,
          status: job.status,
          trigger: readTrigger(job.metadata),
          sizeBytes: job.sizeBytes,
          checksumSha256: job.checksumSha256,
          localPath: job.filePath,
          errorMessage: job.errorMessage,
          createdAt: job.createdAt.toISOString(),
          completedAt: job.completedAt?.toISOString() ?? null,
        })),
        restores: restores.map((restore) => ({
          id: restore.id,
          backupJobId: restore.backupJobId,
          type: jobTypeById.get(restore.backupJobId) ?? "UNKNOWN",
          status: restore.status,
          errorMessage: restore.errorMessage,
          createdAt: restore.createdAt.toISOString(),
          completedAt: restore.completedAt?.toISOString() ?? null,
        })),
        restoreCount,
      };
    },
  };
}
