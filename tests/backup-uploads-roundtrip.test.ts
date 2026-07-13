import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createUploadsPackager } from "@/modules/backups/backup-uploads-packager";
import { restoreUploadsArchive, validateUploadsInventory } from "@/modules/backups/backup-restore-service";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("استعادة ملفات العملاء", () => {
  it("يعيد ملفًا ثنائيًا حقيقيًا بحجم 2MB بنفس SHA-256", async () => {
    const root = await mkdtemp(join(tmpdir(), "frameid-uploads-roundtrip-"));
    roots.push(root);
    const uploads = join(root, "uploads");
    const output = join(root, "output");
    const restored = join(root, "restored");
    await mkdir(join(uploads, "tenant-1", "documents"), { recursive: true });
    const payload = Buffer.alloc(2 * 1024 * 1024, 0x5a);
    const relativePath = "tenant-1/documents/customer-contract.bin";
    await writeFile(join(uploads, relativePath), payload);

    const packaged = await createUploadsPackager(uploads).packageUploads(output, "backup-1");
    expect(packaged.inventory).toEqual([{
      path: relativePath,
      sizeBytes: payload.length,
      sha256: createHash("sha256").update(payload).digest("hex"),
    }]);

    await restoreUploadsArchive(packaged.archivePath, restored);
    const validation = await validateUploadsInventory(restored, packaged.inventory);
    expect(validation).toEqual({ valid: true, errors: [] });
    expect(await readFile(join(restored, relativePath))).toEqual(payload);
  });
});
