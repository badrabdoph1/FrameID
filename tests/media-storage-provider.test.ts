import { describe, expect, it } from "vitest";

import {
  createLegacyMediaStorageAdapter,
  normalizeStorageCapabilities,
  type MediaObjectStorageProvider,
} from "@/modules/media/media-storage-provider";

describe("media storage provider abstraction", () => {
  it("adapts a provider put operation to the legacy media upload save contract", async () => {
    const calls: string[] = [];
    const provider: MediaObjectStorageProvider = {
      id: "test-provider",
      capabilities: normalizeStorageCapabilities({ publicUrls: true }),
      async putObject(input) {
        calls.push(`${input.key}:${input.mimeType}:${input.bytes.byteLength}`);
        return {
          providerId: "test-provider",
          storageKey: input.key,
          url: `/uploads/${input.key}`,
          sizeBytes: input.bytes.byteLength,
        };
      },
    };

    const adapter = createLegacyMediaStorageAdapter(provider);
    const result = await adapter.save({
      storageKey: "tenant_1/photo.webp",
      mimeType: "image/webp",
      bytes: new Uint8Array([1, 2, 3]),
    });

    expect(result).toEqual({ url: "/uploads/tenant_1/photo.webp" });
    expect(calls).toEqual(["tenant_1/photo.webp:image/webp:3"]);
  });

  it("defaults optional destructive and inventory capabilities to false", () => {
    expect(normalizeStorageCapabilities({ publicUrls: true })).toEqual({
      publicUrls: true,
      readObjects: false,
      listObjects: false,
      deleteObjects: false,
      objectMetadata: false,
    });
  });
});
