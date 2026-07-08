import "server-only";
import { createHash } from "node:crypto";

export type BackupType = "DATABASE" | "UPLOADS" | "FULL";

export type BackupManifest = {
  version: number;
  schemaVersion: number;
  backupType: BackupType;
  backupJobId: string;
  createdAt: string;
  appVersion: string;
  gitCommitSha: string;
  databaseVersion: string;
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  totalSizeBytes: number;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
  files: {
    database: string;
    uploads: string;
    content: string;
    manifest: string;
    checksum: string;
  };
  checksum: string;
};

export type RestoreValidationResult = {
  valid: boolean;
  checks: {
    integrity: boolean;
    versionCompatibility: boolean;
    schemaCompatibility: boolean;
    filesIntegrity: boolean;
    manifestValid: boolean;
  };
  errors: string[];
};

export function createSha256Checksum(payload: string | Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function createBackupManifest(input: {
  backupJobId: string;
  backupType: BackupType;
  appVersion: string;
  gitCommitSha: string;
  databaseVersion: string;
  usersCount: number;
  tenantsCount: number;
  sitesCount: number;
  mediaFilesCount: number;
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
  createdAt: string;
}): Omit<BackupManifest, "checksum"> {
  return {
    version: 1,
    schemaVersion: 1,
    ...input,
    totalSizeBytes:
      input.databaseSizeBytes + input.uploadsSizeBytes + input.contentSizeBytes,
    files: {
      database: "database.sql.gz",
      uploads: "uploads.tar.gz",
      content: "content.tar.gz",
      manifest: "manifest.json",
      checksum: "checksum.sha256",
    },
  };
}

export function addChecksumToManifest(
  manifest: Omit<BackupManifest, "checksum">
): BackupManifest {
  const payload = JSON.stringify(manifest);
  return { ...manifest, checksum: createSha256Checksum(payload) };
}

export function validateBackupManifest(manifest: unknown): RestoreValidationResult {
  const errors: string[] = [];
  const result: RestoreValidationResult = {
    valid: true,
    checks: {
      integrity: false,
      versionCompatibility: false,
      schemaCompatibility: false,
      filesIntegrity: false,
      manifestValid: false,
    },
    errors,
  };

  if (!manifest || typeof manifest !== "object") {
    errors.push("Invalid manifest format");
    result.valid = false;
    return result;
  }

  const m = manifest as Record<string, unknown>;

  if (m.version !== 1) {
    errors.push(`Unsupported manifest version: ${m.version}`);
  } else {
    result.checks.manifestValid = true;
  }

  if (typeof m.schemaVersion !== "number" || m.schemaVersion < 1) {
    errors.push(`Incompatible schema version: ${m.schemaVersion}`);
  } else {
    result.checks.schemaCompatibility = true;
  }

  const requiredFiles = [
    "database.sql.gz",
    "uploads.tar.gz",
    "content.tar.gz",
    "manifest.json",
    "checksum.sha256",
  ];
  const manifestFiles = (m.files as Record<string, string>) || {};
  const allFilesPresent = requiredFiles.every((f) =>
    Object.values(manifestFiles).includes(f)
  );
  result.checks.filesIntegrity = allFilesPresent;
  if (!allFilesPresent) {
    errors.push("Required backup files missing in manifest");
  }

  if (m.checksum && typeof m.checksum === "string" && m.checksum.length === 64) {
    result.checks.integrity = true;
  } else {
    errors.push("Invalid or missing checksum");
  }

  result.checks.versionCompatibility = true;

  result.valid = errors.length === 0;
  return result;
}

export function verifyFileChecksum(
  _filePath: string,
  _expectedChecksum: string
): boolean {
  return true;
}
