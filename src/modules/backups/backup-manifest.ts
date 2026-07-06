import { createHash } from "node:crypto";

export type BackupType = "DATABASE" | "UPLOADS" | "FULL";

export type BackupManifestInput = {
  backupJobId: string;
  type: BackupType;
  platformVersion: string;
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
  compressedSizeBytes: number;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
  payloadChecksum: string;
  createdAt: Date;
};

export function createSha256Checksum(payload: string | Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function createBackupManifest(input: BackupManifestInput) {
  return {
    backupJobId: input.backupJobId,
    backupType: input.type,
    platformVersion: input.platformVersion,
    usersCount: input.usersCount,
    tenantsCount: input.tenantsCount,
    sitesCount: input.sitesCount,
    mediaFilesCount: input.mediaFilesCount,
    compressedSizeBytes: input.compressedSizeBytes,
    compressionAlgorithm: input.compressionAlgorithm,
    encryptionEnabled: input.encryptionEnabled,
    sha256Checksum: input.payloadChecksum,
    localVerificationStatus: "PASSED",
    githubUploadStatus: "PENDING",
    createdAt: input.createdAt
  };
}
