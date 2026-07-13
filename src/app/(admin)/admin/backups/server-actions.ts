"use server";

import { runBackupAction } from "@/app/(admin)/admin/backups/actions";
import { prepareMigrationBackupAction } from "@/app/(admin)/admin/backups/actions";
import { restoreLatestGitHubBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { restoreWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { verifyWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { deleteWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { updateBackupSettingsAction } from "@/app/(admin)/admin/backups/actions";
import { verifyAllBackupsAction } from "@/app/(admin)/admin/backups/actions";
import type { SupportedBackupType } from "@/modules/backups/backup-policy";

export async function handleCreateBackup(type: SupportedBackupType) {
  const formData = new FormData();
  formData.set("type", type);
  await runBackupAction(formData);
}

export async function handlePrepareMigrationBackup() {
  await prepareMigrationBackupAction();
}

export async function handleRestoreLatestGitHubBackup() {
  await restoreLatestGitHubBackupAction();
}

export async function handleRestoreWorkspaceBackup(backupJobId: string) {
  const formData = new FormData();
  formData.set("backupJobId", backupJobId);
  await restoreWorkspaceBackupAction(formData);
}

export async function handleVerifyWorkspaceBackup(backupJobId: string) {
  const formData = new FormData();
  formData.set("backupJobId", backupJobId);
  await verifyWorkspaceBackupAction(formData);
}

export async function handleDeleteWorkspaceBackup(backupJobId: string) {
  const formData = new FormData();
  formData.set("backupJobId", backupJobId);
  await deleteWorkspaceBackupAction(formData);
}

export async function handleUpdateBackupSettings(
  type: SupportedBackupType,
  enabled: boolean,
  schedule: string,
  retentionCount: number
) {
  const formData = new FormData();
  formData.set("type", type);
  formData.set("enabled", String(enabled));
  formData.set("schedule", schedule);
  formData.set("retentionCount", String(retentionCount));
  await updateBackupSettingsAction(formData);
}

export async function handleVerifyAllBackups() {
  await verifyAllBackupsAction();
}
