import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { MediaStorageAdapter } from "@/modules/media/media-upload-service";

export function createLocalMediaStorage({
  publicRoot = join(process.cwd(), "public"),
  uploadsBasePath = "uploads"
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

      return {
        url: `/${relativePath.replaceAll("\\", "/")}`
      };
    }
  };
}
