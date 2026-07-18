import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { MediaStorageAdapter } from "@/modules/media/media-upload-service";
import {
  commitPlatformAssetToGitHub,
  resolveGitHubContentConfig,
} from "@/lib/content/git-sync";
import { logger } from "@/lib/errors/logger";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

export function createGitHubMediaStorage({
  publicRoot = join(process.cwd(), "public"),
  uploadsBasePath = "uploads",
}: {
  publicRoot?: string;
  uploadsBasePath?: string;
} = {}): MediaStorageAdapter {
  return {
    async save(input) {
      const relativePath = join(uploadsBasePath, input.storageKey);
      const absolutePath = join(publicRoot, relativePath);

      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, input.bytes);

      const localUrl = `/${relativePath.replaceAll("\\", "/")}`;

      const config = resolveGitHubContentConfig();
      if (config) {
        const result = await commitPlatformAssetToGitHub({
          path: `public/${relativePath}`,
          bytes: input.bytes,
          message: "رفع صورة عبر لوحة التحكم",
        });
        if (result.commitSha) {
          return {
            url: `${GITHUB_RAW_BASE}/${config.repository}/${config.branch}/public/${relativePath.replaceAll("\\", "/")}`,
          };
        }
        if (result.error) {
          logger.error("FID-UPLOAD-GIT-001", `GitHub commit failed: ${result.error}`, {
            path: relativePath,
            storageKey: input.storageKey,
          });
        }
      }

      return { url: localUrl };
    },
  };
}
