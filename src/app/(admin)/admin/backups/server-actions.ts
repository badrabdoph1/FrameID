"use server";

import { runBackupAction } from "@/app/(admin)/admin/backups/actions";
import { prepareMigrationBackupAction } from "@/app/(admin)/admin/backups/actions";
import { restoreLatestGitHubBackupAction } from "@/app/(admin)/admin/backups/actions";
import { restoreWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { verifyWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { deleteWorkspaceBackupAction } from "@/app/(admin)/admin/backups/workspace-actions";
import { updateBackupSettingsAction } from "@/app/(admin)/admin/backups/actions";
import { verifyAllBackupsAction } from "@/app/(admin)/admin/backups/actions";
import { rebuildFromGitHubAction } from "@/app/(admin)/admin/backups/actions";
import { SUPPORTED_BACKUP_TYPES, type SupportedBackupType } from "@/modules/backups/backup-policy";

export async function handleCreateBackup(type: SupportedBackupType) {
  await runBackupAction(type);
}

export async function handlePrepareMigrationBackup() {
  await prepareMigrationBackupAction();
}

export async function handleRestoreLatestGitHubBackup() {
  await restoreLatestGitHubBackupAction();
}

export async function handleRestoreWorkspaceBackup(backupJobId: string) {
  await restoreWorkspaceBackupAction(backupJobId);
}

export async function handleVerifyWorkspaceBackup(backupJobId: string) {
  await verifyWorkspaceBackupAction(backupJobId);
}

export async function handleDeleteWorkspaceBackup(backupJobId: string) {
  await deleteWorkspaceBackupAction(backupJobId);
}

export async function handleUpdateBackupSettings(
  type: SupportedBackupType,
  enabled: boolean,
  schedule: string,
  retentionCount: number
) {
  await updateBackupSettingsAction(type, enabled, schedule, retentionCount);
}

export async function handleVerifyAllBackups() {
  await verifyAllBackupsAction();
}

export async function handleRebuildFromGitHub() {
  await rebuildFromGitHubAction();
}