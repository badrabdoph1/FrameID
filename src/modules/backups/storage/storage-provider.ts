export type BackupFile = {
  name: string;
  path: string;
  sizeBytes: number;
};

export type StorageProvider = {
  name: string;
  upload(input: {
    backupDir: string;
    backupId: string;
    files: BackupFile[];
  }): Promise<{ url: string; sizeBytes: number }>;
  download(input: {
    backupId: string;
    destDir: string;
  }): Promise<string>;
  listBackups(): Promise<BackupFile[]>;
  deleteBackup(backupId: string): Promise<void>;
  getBackupSize(backupId: string): Promise<number>;
};
