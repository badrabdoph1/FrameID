#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";

async function main() {
  const type = process.argv[2]?.toUpperCase();
  if (!type || !["DATABASE", "UPLOADS", "FULL"].includes(type)) {
    console.error("Usage: npm run backup -- [DATABASE|UPLOADS|FULL]");
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
  });

  try {
    const result = await service.runManualBackup({
      type: type as "DATABASE" | "UPLOADS" | "FULL",
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
