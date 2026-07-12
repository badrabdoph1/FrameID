import { describe, expect, it, beforeAll } from "vitest";

import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import type { MediaStorageAdapter, MediaUploadRepository } from "@/modules/media/media-upload-service";
import { createTestPng, createTestFile } from "./test-image-helpers";

let testPng: Buffer;

beforeAll(async () => {
  testPng = await createTestPng(200, 200);
});

function createStorage(): MediaStorageAdapter & { saved: string[] } {
  const saved: string[] = [];
  return {
    saved,
    async save(input) {
      saved.push(`${input.storageKey}:${input.mimeType}:${input.bytes.byteLength}`);
      return { url: `/uploads/${input.storageKey}` };
    },
  };
}

function createRepository(): MediaUploadRepository & { created: string[] } {
  const created: string[] = [];
  return {
    created,
    async createAsset(input) {
      created.push(`${input.tenantId}:${input.storageKey}:${input.mimeType}`);
      return { id: `asset_${input.storageKey}`, url: input.url };
    },
  };
}

function createFile(bytes: Buffer, name: string, type: string): File {
  return {
    name,
    type,
    size: bytes.length,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
    },
  } as File;
}

describe("platform template image upload", () => {
  it("stores a verified template image under the platform namespace", async () => {
    const storage = createStorage();
    const repository = createRepository();

    const result = await uploadPlatformTemplateImage(
      createFile(testPng, "Template Cover.PNG", "image/png"),
      { storage, repository, createId: () => "cover-id" },
    );

    expect(result).toEqual({
      storageKey: "asset_platform/templates/cover-id-template-cover.png",
      url: "/uploads/platform/templates/cover-id-template-cover.png",
    });

    expect(storage.saved[0]).toContain("platform/templates/cover-id-template-cover.png");
    expect(storage.saved[0]).toContain("image/webp");
    expect(repository.created).toContain("platform:platform/templates/cover-id-template-cover.png:image/webp");
  });

  it("rejects a file whose bytes do not match the declared image type", async () => {
    const storage = createStorage();
    const repository = createRepository();
    const fake = createFile(Buffer.from("MZ executable"), "cover.jpg", "image/jpeg");

    await expect(uploadPlatformTemplateImage(fake, { storage, repository })).rejects.toThrow(
      "Invalid image/jpeg signature",
    );
    expect(storage.saved).toEqual([]);
    expect(repository.created).toEqual([]);
  });
});