#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";

async function main() {
  const type = process.argv[2]?.toUpperCase();
  if (!isSupportedBackupType(type)) {
    console.error("Usage: npm run backup -- [DATABASE|FULL]");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const service = createBackupJobService({
    repository: createPrismaBackupJobRepository(prisma as never),
    databaseUrl,
    platformVersion: process.env.npm_package_version ?? "0.1.0",
    backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
    backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
    gitCommitSha: process.env.RAILWAY_GIT_COMMIT_SHA,
  });

  try {
    const result = await service.runBackup({
      type,
      trigger: "CLI",
      initiatedById: "cli-script",
      note: "CLI backup",
    });

    console.log(JSON.stringify(result, null, 2));
    console.log(`Backup completed: ${result.backupId}`);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
