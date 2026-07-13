import { join } from "node:path";

import { prisma } from "@/lib/prisma";
import { createGitHubStorage } from "./backup-storage-github";
import { createGitHubBackupCatalogReconciler } from "./github-backup-catalog-reconciler";
import { createPrismaGitHubBackupCatalogIndex } from "./prisma-github-backup-catalog-index";

function repositorySlug(): string {
  const configured = process.env.BACKUP_GITHUB_REPOSITORY?.trim();
  if (configured) return configured.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
  const owner = process.env.RAILWAY_GIT_REPO_OWNER?.trim();
  const name = process.env.RAILWAY_GIT_REPO_NAME?.trim();
  if (owner && name) return `${owner}/${name}`;
  throw new Error("تعذر تحديد مستودع GitHub لإعادة بناء فهرس النسخ.");
}

let reconciliation: Promise<{ indexed: number; database: number; full: number; skippedCleanup?: boolean }> | null = null;

export function reconcileProductionGitHubBackupCatalog() {
  if (reconciliation) return reconciliation;
  reconciliation = (async () => {
    const token = process.env.BACKUP_GITHUB_TOKEN?.trim();
    if (!token) throw new Error("BACKUP_GITHUB_TOKEN مطلوب لإعادة بناء فهرس النسخ من GitHub.");
    const repository = repositorySlug();
    const source = createGitHubStorage(token, repository);
    if (!source) throw new Error("تعذر فتح تخزين GitHub الرسمي.");
    const reconciler = createGitHubBackupCatalogReconciler({
      source,
      index: createPrismaGitHubBackupCatalogIndex(prisma as never),
      repository,
      backupRoot: process.env.BACKUP_DIR || join(process.cwd(), "backups"),
    });
    return reconciler.reconcile();
  })().finally(() => { reconciliation = null; });
  return reconciliation;
}
