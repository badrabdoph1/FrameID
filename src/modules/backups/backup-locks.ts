import { randomUUID } from "node:crypto";

export type BackupLock = {
  acquire(type: string): Promise<boolean>;
  release(type: string): Promise<void>;
  isLocked(type: string): Promise<boolean>;
};

type LockEntry = {
  id: string;
  acquiredAt: number;
  expiresAt: number;
};

export function createMemoryBackupLock(): BackupLock {
  const locks = new Map<string, LockEntry>();

  function isExpired(entry: LockEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  return {
    async acquire(type: string): Promise<boolean> {
      const existing = locks.get(type);
      if (existing && !isExpired(existing)) {
        return false;
      }
      locks.set(type, {
        id: randomUUID(),
        acquiredAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
      return true;
    },

    async release(type: string): Promise<void> {
      locks.delete(type);
    },

    async isLocked(type: string): Promise<boolean> {
      const entry = locks.get(type);
      if (!entry) return false;
      if (isExpired(entry)) {
        locks.delete(type);
        return false;
      }
      return true;
    },
  };
}

export function createDatabaseBackupLock(
  prisma: {
    backupJob: {
      count(input: { where: { type: string; status: string; startedAt: { gte: Date } } }): Promise<number>;
    };
  }
): BackupLock {
  return {
    async acquire(type: string): Promise<boolean> {
      const running = await prisma.backupJob.count({
        where: {
          type,
          status: "RUNNING",
          startedAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      });
      return running === 0;
    },

    async release(): Promise<void> {
      return;
    },

    async isLocked(type: string): Promise<boolean> {
      const running = await prisma.backupJob.count({
        where: {
          type,
          status: "RUNNING",
          startedAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      });
      return running > 0;
    },
  };
}
