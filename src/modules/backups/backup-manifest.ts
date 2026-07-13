import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { isSupportedBackupType, type SupportedBackupType } from "@/modules/backups/backup-policy";

export type BackupType = SupportedBackupType;

export type BackupFileInventoryItem = { path: string; sizeBytes: number; sha256: string };

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
  customerDataCounts?: Record<string, number>;
  uploadsInventory?: BackupFileInventoryItem[];
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  totalSizeBytes: number;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
  artifactChecksums: { database: string; uploads: string | null };
  files: {
    database: string;
    uploads: string | null;
    content: null;
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

export async function createFileSha256Checksum(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
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
  customerDataCounts: Record<string, number>;
  uploadsInventory: BackupFileInventoryItem[];
  databaseSizeBytes: number;
  uploadsSizeBytes: number;
  contentSizeBytes: number;
  compressionAlgorithm: string;
  encryptionEnabled: boolean;
  artifactChecksums: { database: string; uploads: string | null };
  createdAt: string;
}): Omit<BackupManifest, "checksum"> {
  return {
    version: 2,
    schemaVersion: 2,
    ...input,
    totalSizeBytes:
      input.databaseSizeBytes + input.uploadsSizeBytes + input.contentSizeBytes,
    files: {
      database: "database.sql.gz",
      uploads: input.backupType === "FULL" ? "uploads.tar.gz" : null,
      content: null,
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

  if (m.version !== 1 && m.version !== 2) {
    errors.push(`Unsupported manifest version: ${m.version}`);
  } else {
    result.checks.manifestValid = true;
  }

  if (typeof m.schemaVersion !== "number" || m.schemaVersion < 1 || m.schemaVersion > 2) {
    errors.push(`Incompatible schema version: ${m.schemaVersion}`);
  } else {
    result.checks.schemaCompatibility = true;
  }

  const backupType = m.backupType;
  if (!isSupportedBackupType(backupType)) {
    errors.push(`Unsupported backup type: ${String(backupType)}`);
  }

  const requiredFiles = [
    "database.sql.gz",
    ...(backupType === "FULL" ? ["uploads.tar.gz"] : []),
    "manifest.json",
    "checksum.sha256",
  ];
  const manifestFiles = (m.files as Record<string, string | null>) || {};
  const manifestFileValues = Object.values(manifestFiles).filter(Boolean);
  const allFilesPresent = requiredFiles.every((f) => manifestFileValues.includes(f));
  result.checks.filesIntegrity = allFilesPresent;
  if (!allFilesPresent) {
    errors.push("Required backup files missing in manifest");
  }

  if (m.checksum && typeof m.checksum === "string" && m.checksum.length === 64) {
    result.checks.integrity = true;
  } else {
    errors.push("Invalid or missing checksum");
  }

  if (m.version === 2) {
    if (!m.customerDataCounts || typeof m.customerDataCounts !== "object" || Array.isArray(m.customerDataCounts)) errors.push("Invalid or missing customerDataCounts");
    if (!Array.isArray(m.uploadsInventory)) errors.push("Invalid or missing uploadsInventory");
  }

  result.checks.versionCompatibility = true;

  result.valid = errors.length === 0;
  return result;
}

export async function verifyFileChecksum(
  filePath: string,
  expectedChecksum: string
): Promise<boolean> {
  try {
    const content = await readFile(filePath, "utf-8");
    const actualChecksum = createSha256Checksum(content);
    return actualChecksum === expectedChecksum;
  } catch {
    return false;
  }
}

export async function verifyDatabaseDumpIntegrity(
  dumpPath: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const stats = await stat(dumpPath);
    if (stats.size === 0) {
      return { valid: false, error: "Database dump is empty" };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Cannot read dump file",
    };
  }
}

export async function verifyArchiveIntegrity(
  archivePath: string
): Promise<{ valid: boolean; fileCount?: number; error?: string }> {
  try {
    const stats = await stat(archivePath);
    if (stats.size === 0) {
      return { valid: false, error: "Archive is empty" };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Cannot read archive",
    };
  }
}
