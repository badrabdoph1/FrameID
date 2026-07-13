import { validateCustomerDataCounts } from "./customer-data-inventory";

export type BackupDataCounts = {
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
};

export type DisasterRecoveryCandidate = BackupDataCounts & { backupId: string };

export function selectDisasterRecoveryBackup(candidates: DisasterRecoveryCandidate[]) {
  return candidates.find((candidate) => candidate.tenantsCount > 0 || candidate.sitesCount > 0 || candidate.mediaFilesCount > 0)
    ?? candidates[0]
    ?? null;
}

export function validateRestoredCounts(expected: BackupDataCounts, actual: BackupDataCounts) {
  return validateCustomerDataCounts(expected, actual);
}
