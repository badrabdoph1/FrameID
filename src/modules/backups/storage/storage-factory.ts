import type { StorageProvider } from "./storage-provider";
import { createLocalStorageProvider } from "./local-storage-provider";

export type StorageConfig = {
  type: "local" | "github";
  backupRoot?: string;
  githubToken?: string;
  githubRepo?: string;
  githubBranch?: string;
};

export function createStorageProvider(
  config: StorageConfig,
  backupRoot: string
): StorageProvider {
  switch (config.type) {
    case "local":
      return createLocalStorageProvider(backupRoot);
    default:
      return createLocalStorageProvider(backupRoot);
  }
}
