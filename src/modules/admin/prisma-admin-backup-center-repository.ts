type PrismaAdminBackupCenterClient = {
  backupSettings: {
    findMany(input: unknown): Promise<unknown>;
  };
  backupJob: {
    findMany(input: unknown): Promise<unknown>;
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

export function createPrismaAdminBackupCenterRepository(
  prisma: PrismaAdminBackupCenterClient
) {
  return {
    async getBackupCenter() {
      const [settings, jobs] = await Promise.all([
        prisma.backupSettings.findMany({
          orderBy: {
            type: "asc"
          },
          select: {
            type: true,
            enabled: true,
            schedule: true,
            retentionCount: true,
            lastRunAt: true,
            nextRunAt: true
          }
        }) as Promise<RawBackupSetting[]>,
        prisma.backupJob.findMany({
          orderBy: {
            createdAt: "desc"
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
            createdAt: true
          }
        }) as Promise<RawBackupJob[]>
      ]);

      return {
        settings,
        jobs: jobs.map((job) => ({
          ...job,
          createdAt: job.createdAt.toISOString()
        }))
      };
    }
  };
}
