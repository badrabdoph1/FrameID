#!/usr/bin/env tsx
import { join } from "node:path";
import { createRestoreService } from "@/modules/backups/backup-restore-service";
import { SUPPORTED_BACKUP_TYPES, isSupportedBackupType } from "@/modules/backups/backup-policy";

async function main() {
  const backupId = process.argv[2];
  const type = (process.argv[3] || "FULL").toUpperCase();
  const databaseUrl = process.env.DATABASE_URL;

  if (!backupId) {
    console.error("Usage: npm run restore -- <backup-id> [DATABASE|FULL]");
    console.error("Available backups:");
    const { listBackupDirs } = await import("@/modules/backups/local-backup-artifact-writer");
    const dirs = await listBackupDirs();
    for (const dir of dirs) {
      console.error(`  ${dir}`);
    }
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  if (!isSupportedBackupType(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${SUPPORTED_BACKUP_TYPES.join(", ")}`);
    process.exit(1);
  }

  const restoreService = createRestoreService();
  const backupRoot = join(process.cwd(), "backups");

  console.log(`Validating backup: ${backupId}...`);
  const validation = await restoreService.validateBackup({
    backupId,
    backupRoot,
  });

  if (!validation.valid) {
    console.error("Backup validation failed:");
    console.error(JSON.stringify(validation.validation, null, 2));
    if (!process.argv.includes("--force")) {
      process.exit(1);
    }
    console.log("Proceeding with restore despite validation warnings (--force)...");
  } else {
    console.log("Backup validation passed ✓");
  }

  console.log(`Restoring ${type} from backup ${backupId}...`);
  const result = await restoreService.executeRestore({
    backupId,
    backupRoot,
    databaseUrl,
    type,
    skipChecksumVerification: process.argv.includes("--force"),
  });

  if (result.success) {
    console.log("Restore completed successfully ✓");
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error("Restore failed:");
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const postValidation = await restoreService.validatePostRestore(databaseUrl);
  console.log("Post-restore validation:");
  console.log(JSON.stringify(postValidation, null, 2));

  if (postValidation.passed) {
    console.log("All post-restore checks passed ✓");
  } else {
    console.warn("Some post-restore checks failed:");
    for (const [key, passed] of Object.entries(postValidation.checks)) {
      if (!passed) {
        console.warn(`  ✗ ${key}`);
      }
    }
  }
}

main();
