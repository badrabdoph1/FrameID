import { describe, expect, it, beforeAll } from "vitest";

import {
  createMediaUploadService,
  matchesImageSignature,
  type MediaStorageAdapter,
  type MediaUploadRepository,
} from "@/modules/media/media-upload-service";
import { createTestJpeg, createTestPng, createTestWebp, createTestFile } from "./test-image-helpers";

let testJpeg: Buffer;
let testPng: Buffer;
let testWebp: Buffer;

beforeAll(async () => {
  testJpeg = await createTestJpeg();
  testPng = await createTestPng();
  testWebp = await createTestWebp();
});

function createAdapters(): {
  storage: MediaStorageAdapter & { saved: string[] };
  repository: MediaUploadRepository & { created: string[] };
} {
  const saved: string[] = [];
  const created: string[] = [];
  return {
    storage: {
      saved,
      async save(input) {
        saved.push(`${input.storageKey}:${input.mimeType}:${input.bytes.byteLength}`);
        return { url: `/uploads/${input.storageKey}` };
      },
    },
    repository: {
      created,
      async createAsset(input) {
        created.push(`${input.tenantId}:${input.storageKey}:${input.mimeType}`);
        return { id: "asset_1", url: input.url };
      },
    },
  };
}

describe("media upload service", () => {
  it("stores valid image uploads and creates media metadata", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({ storage, repository, createId: () => "asset-key" });
    const file = createTestFile(testJpeg, "hero.jpg", "image/jpeg");

    await expect(service.uploadImage({ tenantId: "tenant_1", file, alt: "Hero" })).resolves.toEqual({
      id: "asset_1",
      url: "/uploads/tenant_1/asset-key-hero.jpg",
    });
    expect(storage.saved.length).toBe(1);
    expect(storage.saved[0]).toContain("tenant_1/asset-key-hero.jpg");
    expect(storage.saved[0]).toContain("image/webp");
    expect(repository.created).toContain("tenant_1:tenant_1/asset-key-hero.jpg:image/webp");
  });

  it("rejects unsupported file types", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({ storage, repository });
    const file = createTestFile(Buffer.from("text"), "note.txt", "text/plain");
    await expect(service.uploadImage({ tenantId: "tenant_1", file })).rejects.toThrow("نوع الملف غير مدعوم");
  });

  it("rejects executable or text content disguised as an image", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({ storage, repository });
    const file = createTestFile(Buffer.from("MZ fake executable"), "fake.jpg", "image/jpeg");
    await expect(service.uploadImage({ tenantId: "tenant_1", file })).rejects.toThrow("محتوى الملف لا يطابق صيغة الصورة");
    expect(storage.saved).toEqual([]);
    expect(repository.created).toEqual([]);
  });

  it("accepts processed photographer images up to the dashboard limit", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({ storage, repository, createId: () => "large-key" });
    const largeWebp = await createTestWebp(2000, 1500);
    const file = createTestFile(largeWebp, "processed.webp", "image/webp");
    await expect(service.uploadImage({ tenantId: "tenant_1", file })).resolves.toEqual({
      id: "asset_1",
      url: "/uploads/tenant_1/large-key-processed.webp",
    });
  });

  it("recognizes supported image signatures", () => {
    expect(matchesImageSignature(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg")).toBe(true);
    expect(matchesImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(matchesImageSignature(new TextEncoder().encode("RIFF0000WEBP"), "image/webp")).toBe(true);
  });
});