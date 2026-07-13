import { beforeAll, describe, expect, it } from "vitest";

import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import { createTestPng } from "./test-image-helpers";

let testPng: Buffer;
beforeAll(async () => { testPng = await createTestPng(200, 200); });

function createFile(bytes: Buffer, name: string, type: string): File {
  return { name, type, size: bytes.length, async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length); } } as File;
}

describe("رفع صور المنصة", () => {
  it("يحفظ الصورة كملف مشروع في GitHub دون MediaAsset", async () => {
    const committed: Array<{ path: string; size: number }> = [];
    const result = await uploadPlatformTemplateImage(createFile(testPng, "Template Cover.PNG", "image/png"), {
      createId: () => "cover-id",
      commit: async (input) => {
        committed.push({ path: input.path, size: input.bytes.byteLength });
        return { enabled: true, commitSha: "abc123" };
      },
    });
    expect(result).toEqual({
      storageKey: "public/platform/templates/cover-id-template-cover.webp",
      url: "/platform/templates/cover-id-template-cover.webp",
      commitId: "abc123",
    });
    expect(committed[0].path).toBe("public/platform/templates/cover-id-template-cover.webp");
    expect(committed[0].size).toBeGreaterThan(0);
  });

  it("يرفض ملفًا لا تطابق بايتاته نوع الصورة", async () => {
    const fake = createFile(Buffer.from("MZ executable"), "cover.jpg", "image/jpeg");
    await expect(uploadPlatformTemplateImage(fake, { commit: async () => ({ enabled: true, commitSha: "never" }) })).rejects.toThrow("Invalid image/jpeg signature");
  });
});
