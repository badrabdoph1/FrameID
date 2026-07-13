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
  const errors = (Object.keys(expected) as (keyof BackupDataCounts)[])
    .filter((key) => expected[key] !== actual[key])
    .map((key) => `${key}: المتوقع ${expected[key]} والفعلي ${actual[key]}`);
  return { valid: errors.length === 0, errors };
}
