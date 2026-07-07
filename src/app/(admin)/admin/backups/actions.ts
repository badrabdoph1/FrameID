"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import type { BackupType } from "@/modules/backups/backup-manifest";
import { createLocalBackupArtifactWriter } from "@/modules/backups/local-backup-artifact-writer";

export async function runBackupAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const type = formData.get("type");

  if (type !== "DATABASE" && type !== "UPLOADS" && type !== "FULL") {
    redirect("/admin/backups?error=invalid-type");
  }

  try {
    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma),
      artifactWriter: createLocalBackupArtifactWriter(),
      platformVersion: process.env.npm_package_version ?? "0.1.0",
    });

    await service.runManualBackup({
      type: type as BackupType,
      initiatedById: session.user.id,
      note: "نسخة يدوية من مركز النسخ الاحتياطي",
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "runBackup", type },
    });
    redirect(`/admin/backups?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/backups");
  redirect("/admin/backups?started=1");
}
