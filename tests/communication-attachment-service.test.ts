import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  CommunicationAttachmentError,
  acceptProcessedCommunicationAttachments,
  cleanupPreparedCommunicationAttachments,
  createLocalCommunicationAttachmentStore,
  prepareCommunicationAttachments,
} from "@/modules/communication-center/attachment-service";

async function pngFile(): Promise<File> {
  const bytes = await sharp({
    create: { width: 1, height: 1, channels: 4, background: "#ffffff" },
  }).png().toBuffer();
  const file = new File([bytes], "screen.png", { type: "image/png" });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return file;
}

describe("communication attachment service", () => {
  it("stores a decoded screenshot privately and returns core metadata", async () => {
    const root = await mkdtemp(join(tmpdir(), "frameid-communication-"));
    const store = createLocalCommunicationAttachmentStore({ root });
    const file = await pngFile();

    const result = await prepareCommunicationAttachments({
      files: [file],
      tenantId: "tenant-1",
      createId: () => "attachment-1",
      store,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      storageProvider: "communication-private-local",
      storageKey: "tenant-1/attachment-1.webp",
      originalName: "screen.png",
      mimeType: "image/webp",
      width: 1,
      height: 1,
    });
    expect(result[0]?.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    await expect(readFile(join(root, "tenant-1", "attachment-1.webp"))).resolves.toBeInstanceOf(Buffer);
  });

  it("rejects more than five files before writing any object", async () => {
    const writes: string[] = [];
    const file = await pngFile();

    await expect(prepareCommunicationAttachments({
      files: Array.from({ length: 6 }, () => file),
      tenantId: "tenant-1",
      createId: () => "attachment",
      store: {
        id: "memory",
        async put(input) { writes.push(input.key); },
        async read() { return new Uint8Array(); },
      },
    })).rejects.toBeInstanceOf(CommunicationAttachmentError);
    expect(writes).toHaveLength(0);
  });

  it("prevents storage traversal when reading private objects", async () => {
    const root = await mkdtemp(join(tmpdir(), "frameid-communication-"));
    const store = createLocalCommunicationAttachmentStore({ root });

    await expect(store.read("../secrets.txt")).rejects.toThrow("مسار");
  });

  it("marks only the processed entry attachments as clean", async () => {
    let args: unknown;
    const prisma = {
      communicationAttachment: {
        updateMany: async (input: unknown) => { args = input; return { count: 2 }; },
      },
    };

    await expect(acceptProcessedCommunicationAttachments(prisma as never, "entry-1")).resolves.toBe(2);
    expect(args).toEqual({
      where: { entryId: "entry-1", scanStatus: "PENDING", deletedAt: null },
      data: { scanStatus: "CLEAN", scannedAt: expect.any(Date) },
    });
  });

  it("removes prepared objects when a later write path is abandoned", async () => {
    const removed: string[] = [];
    await cleanupPreparedCommunicationAttachments([
      { storageProvider: "memory", storageKey: "tenant-1/a.webp", originalName: "a.png", mimeType: "image/webp", sizeBytes: 1, checksumSha256: "a".repeat(64) },
    ], {
      id: "memory",
      async put() {},
      async read() { return new Uint8Array(); },
      async remove(key) { removed.push(key); },
    });
    expect(removed).toEqual(["tenant-1/a.webp"]);
  });
});
