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
  trigger: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  localPath: string | null;
  createdAt: Date;
};

type RawRestoreJob = {
  id: string;
  backupId: string;
  type: string;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
};

export function createPrismaAdminBackupCenterRepository(
  prisma: PrismaAdminBackupCenterClient
) {
  return {
    async getBackupCenter() {
      const [settings, jobs, restores, restoreCount] = await Promise.all([
        prisma.backupSettings.findMany({
          orderBy: {
            type: "asc",
          },
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
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            type: true,
            status: true,
            trigger: true,
            sizeBytes: true,
            checksumSha256: true,
            localPath: true,
            createdAt: true,
          },
        }) as Promise<RawBackupJob[]>,
        prisma.restoreJob.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            backupId: true,
            type: true,
            status: true,
            errorMessage: true,
            createdAt: true,
          },
        }) as Promise<RawRestoreJob[]>,
        prisma.restoreJob.count({}) as Promise<number>,
      ]);

      return {
        settings,
        jobs: jobs.map((job) => ({
          ...job,
          createdAt: job.createdAt.toISOString(),
        })),
        restores: restores.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        restoreCount,
      };
    },
  };
}
