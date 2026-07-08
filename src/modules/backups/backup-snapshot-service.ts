import { createDatabaseDumper } from "./backup-database-dumper";
import { createUploadsPackager } from "./backup-uploads-packager";
import { createContentPackager } from "./backup-content-packager";
import { createBackupPackage } from "./backup-package-creator";
import { createBackupManifest, addChecksumToManifest } from "./backup-manifest";
import { createLocalBackupArtifactWriter } from "./local-backup-artifact-writer";
import { join } from "node:path";

export type SnapshotOptions = {
  reason: string;
  databaseUrl: string;
  uploadsDir?: string;
  contentDir?: string;
  backupRoot?: string;
  platformVersion: string;
  gitCommitSha?: string;
  initiatedById: string;
};

export type SnapshotResult = {
  backupId: string;
  backupDir: string;
  success: boolean;
  error?: string;
  durationMs: number;
};

export type SnapshotService = {
  createSnapshot(options: SnapshotOptions): Promise<SnapshotResult>;
};

async function countNonHiddenFiles(dir: string): Promise<number> {
  try {
    const { readdir, stat } = await import("node:fs/promises");
    let count = 0;
    const entries = await readdir(dir, { recursive: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      try {
        const s = await stat(join(dir, entry));
        if (s.isFile()) count++;
      } catch {}
    }
    return count;
  } catch {
    return 0;
  }
}

export function createSnapshotService(): SnapshotService {
  return {
    async createSnapshot(options: SnapshotOptions): Promise<SnapshotResult> {
      const startTime = Date.now();
      const root = options.backupRoot ?? join(process.cwd(), "backups");
      const uploadRoot = options.uploadsDir ?? join(process.cwd(), "public", "uploads");
      const contentRoot = options.contentDir ?? join(process.cwd(), "content");

      const dbDumper = createDatabaseDumper(options.databaseUrl);
      const uploadPkg = createUploadsPackager(uploadRoot);
      const contentPkg = createContentPackager(contentRoot);
      const writer = createLocalBackupArtifactWriter({ backupRoot: root });

      try {
        const [dbResult, upResult, ctResult, migrationVersion] =
          await Promise.all([
            dbDumper.dumpDatabase(root, "snapshot"),
            uploadPkg.packageUploads(root, "snapshot"),
            contentPkg.packageContent(root, "snapshot"),
            dbDumper.getMigrationVersion().catch(() => "unknown"),
          ]);

        const [uploadFileCount, contentFileCount] = await Promise.all([
          countNonHiddenFiles(uploadRoot),
          countNonHiddenFiles(contentRoot),
        ]);

        const createdAt = new Date().toISOString();

        const manifestInput = createBackupManifest({
          backupJobId: `snapshot-${Date.now()}`,
          backupType: "FULL",
          appVersion: options.platformVersion,
          gitCommitSha: options.gitCommitSha ?? "",
          databaseVersion: migrationVersion,
          usersCount: 0,
          tenantsCount: 0,
          sitesCount: 0,
          mediaFilesCount: uploadFileCount + contentFileCount,
          databaseSizeBytes: dbResult.sizeBytes,
          uploadsSizeBytes: upResult.sizeBytes,
          contentSizeBytes: ctResult.sizeBytes,
          compressionAlgorithm: "gzip",
          encryptionEnabled: false,
          createdAt,
        });

        const manifest = addChecksumToManifest(manifestInput);

        const backupPackage = await createBackupPackage(
          {
            databaseDumpPath: dbResult.dumpPath,
            uploadsArchivePath: upResult.archivePath,
            contentArchivePath: ctResult.archivePath,
            databaseSizeBytes: dbResult.sizeBytes,
            uploadsSizeBytes: upResult.sizeBytes,
            contentSizeBytes: ctResult.sizeBytes,
            manifest,
          },
          root
        );

        await writer.writeBackup({
          backupId: backupPackage.backupId,
          type: "FULL",
          databaseDumpPath: backupPackage.databaseDumpPath ?? "",
          uploadsArchivePath: backupPackage.uploadsArchivePath,
          contentArchivePath: backupPackage.contentArchivePath,
          databaseSizeBytes: backupPackage.databaseSizeBytes,
          uploadsSizeBytes: backupPackage.uploadsSizeBytes,
          contentSizeBytes: backupPackage.contentSizeBytes,
          manifest,
          checksumSha256: backupPackage.checksumSha256,
        });

        return {
          backupId: backupPackage.backupId,
          backupDir: backupPackage.backupDir,
          success: true,
          durationMs: Date.now() - startTime,
        };
      } catch (error) {
        return {
          backupId: "",
          backupDir: "",
          success: false,
          error: error instanceof Error ? error.message : "Snapshot failed",
          durationMs: Date.now() - startTime,
        };
      }
    },
  };
}
