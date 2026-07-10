import { describe, expect, it } from "vitest";

import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import type { MediaStorageAdapter } from "@/modules/media/media-upload-service";

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

function createFile(bytes: Uint8Array, name: string, type: string): File {
  return {
    name,
    type,
    size: bytes.byteLength,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  } as File;
}

describe("platform template image upload", () => {
  it("stores a verified template image under the platform namespace", async () => {
    const storage = createStorage();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    await expect(uploadPlatformTemplateImage(
      createFile(png, "Template Cover.PNG", "image/png"),
      { storage, createId: () => "cover-id" },
    )).resolves.toEqual({
      storageKey: "platform/templates/cover-id-template-cover.png",
      url: "/uploads/platform/templates/cover-id-template-cover.png",
    });

    expect(storage.saved).toEqual([
      "platform/templates/cover-id-template-cover.png:image/png:9",
    ]);
  });

  it("rejects a file whose bytes do not match the declared image type", async () => {
    const storage = createStorage();
    const fake = createFile(new TextEncoder().encode("MZ executable"), "cover.jpg", "image/jpeg");

    await expect(uploadPlatformTemplateImage(fake, { storage })).rejects.toThrow(
      "محتوى الملف لا يطابق صيغة الصورة",
    );
    expect(storage.saved).toEqual([]);
  });
});
