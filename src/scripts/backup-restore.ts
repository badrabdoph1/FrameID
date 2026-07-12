#!/usr/bin/env tsx
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { createOfficialRestorePipeline } from "@/modules/backups/frameid-restore-pipeline";
import { createGitHubStorage } from "@/modules/backups/backup-storage-github";
import { getGitHubBackupBranch } from "@/modules/backups/backup-job-service";
import { SUPPORTED_BACKUP_TYPES, isSupportedBackupType } from "@/modules/backups/backup-policy";

async function main() {
  const requestedId = process.argv[2] || "latest";
  const type = (process.argv[3] || "FULL").toUpperCase();
  const databaseUrl = process.env.DATABASE_URL;
  const token = process.env.BACKUP_GITHUB_TOKEN || "";
  if (!databaseUrl) throw new Error("DATABASE_URL مطلوب");
  if (!token) throw new Error("BACKUP_GITHUB_TOKEN مطلوب");
  if (!isSupportedBackupType(type)) throw new Error(`نوع غير صالح. الأنواع: ${SUPPORTED_BACKUP_TYPES.join(", ")}`);
  const github = createGitHubStorage(token, process.env.BACKUP_GITHUB_REPOSITORY);
  if (!github) throw new Error("تعذر تهيئة GitHub");
  const branch = getGitHubBackupBranch(type);
  const backupId = requestedId === "latest" ? (await github.listBackups(branch))[0] : requestedId;
  if (!backupId) throw new Error(`لا توجد نسخة ${type} على GitHub`);
  const prisma = new PrismaClient();
  try { const pipeline = createOfficialRestorePipeline({ prisma: prisma as never, databaseUrl, backupRoot: join(process.cwd(), "backups"), githubToken: token, githubRepository: process.env.BACKUP_GITHUB_REPOSITORY }); const result = await pipeline.restore({ backupId, type, trigger: "CLI", actorId: "cli-script" }); console.log(JSON.stringify(result, null, 2)); }
  finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "فشلت الاستعادة"); process.exit(1); });
