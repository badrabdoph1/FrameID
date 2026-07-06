import { describe, expect, it } from "vitest";

import {
  createMediaUploadService,
  type MediaStorageAdapter,
  type MediaUploadRepository
} from "@/modules/media/media-upload-service";

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
        return {
          url: `/uploads/${input.storageKey}`
        };
      }
    },
    repository: {
      created,
      async createAsset(input) {
        created.push(`${input.tenantId}:${input.storageKey}:${input.mimeType}`);
        return {
          id: "asset_1",
          url: input.url
        };
      }
    }
  };
}

describe("media upload service", () => {
  it("stores valid image uploads and creates media metadata", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({
      storage,
      repository,
      createId: () => "asset-key"
    });
    const file = createTestFile("image-bytes", "hero.jpg", "image/jpeg");

    await expect(
      service.uploadImage({
        tenantId: "tenant_1",
        file,
        alt: "Hero"
      })
    ).resolves.toEqual({
      id: "asset_1",
      url: "/uploads/tenant_1/asset-key-hero.jpg"
    });

    expect(storage.saved).toEqual(["tenant_1/asset-key-hero.jpg:image/jpeg:11"]);
    expect(repository.created).toEqual([
      "tenant_1:tenant_1/asset-key-hero.jpg:image/jpeg"
    ]);
  });

  it("rejects unsupported file types", async () => {
    const { storage, repository } = createAdapters();
    const service = createMediaUploadService({ storage, repository });
    const file = createTestFile("text", "note.txt", "text/plain");

    await expect(
      service.uploadImage({
        tenantId: "tenant_1",
        file
      })
    ).rejects.toThrow("Unsupported media type");
  });
});

function createTestFile(content: string, name: string, type: string): File {
  return {
    name,
    type,
    size: content.length,
    async arrayBuffer() {
      return new TextEncoder().encode(content).buffer;
    }
  } as File;
}
