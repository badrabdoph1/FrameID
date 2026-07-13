import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

import { createFileSha256Checksum, type BackupFileInventoryItem } from "./backup-manifest";

export async function collectUploadsInventory(uploadsDir: string): Promise<BackupFileInventoryItem[]> {
  const inventory: BackupFileInventoryItem[] = [];
  if (!existsSync(uploadsDir)) return inventory;
  const files = (await readdir(uploadsDir, { recursive: true })).map(String).sort();
  for (const file of files) {
    if (file.split(/[\\/]/).some((part) => part.startsWith("."))) continue;
    const filePath = join(uploadsDir, file);
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) continue;
    inventory.push({ path: file.replaceAll("\\", "/"), sizeBytes: fileStat.size, sha256: await createFileSha256Checksum(filePath) });
  }
  return inventory;
}

export async function validateUploadsInventory(uploadsDir: string, expected: BackupFileInventoryItem[]) {
  const actual = await collectUploadsInventory(uploadsDir);
  const actualByPath = new Map(actual.map((file) => [file.path, file]));
  const errors: string[] = [];
  for (const file of expected) {
    const restored = actualByPath.get(file.path);
    if (!restored) errors.push(`${file.path}: الملف غير موجود بعد Restore`);
    else if (restored.sizeBytes !== file.sizeBytes || restored.sha256 !== file.sha256) errors.push(`${file.path}: الحجم أو SHA-256 لا يطابق Manifest`);
  }
  const expectedPaths = new Set(expected.map((file) => file.path));
  for (const file of actual) if (!expectedPaths.has(file.path)) errors.push(`${file.path}: ملف زائد غير موجود في Manifest`);
  return { valid: errors.length === 0, errors };
}
