import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { createPlatformPageImageService } from "@/modules/platform-pages/platform-page-image-service";
import { createTestJpeg } from "./test-image-helpers";

describe("platform page image service", () => {
  it("crops around the chosen focus, compresses to webp and records one asset", async () => {
    const storage = {
      save: vi.fn().mockResolvedValue({ url: "/uploads/platform-pages/asset.webp" }),
    };
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: "asset-1",
        url: "/uploads/platform-pages/asset.webp",
      }),
    };
    const service = createPlatformPageImageService({
      storage,
      repository,
      createId: () => "asset-1",
    });

    const result = await service.upload({
      bytes: await createTestJpeg(1600, 1200),
      mimeType: "image/jpeg",
      originalName: "portrait.jpg",
      focusX: 0.8,
      focusY: 0.4,
      zoom: 1.25,
      actorId: "admin-1",
    });

    const savedBytes = Buffer.from(storage.save.mock.calls[0][0].bytes);
    const metadata = await sharp(savedBytes).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1920);
    expect(metadata.height).toBe(1080);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "asset-1",
        mimeType: "image/webp",
        width: 1920,
        height: 1080,
        focusX: 0.8,
        focusY: 0.4,
        zoom: 1.25,
      }),
    );
    expect(result).toEqual({ id: "asset-1", url: "/uploads/platform-pages/asset.webp" });
  });

  it("rejects crop values outside the safe range before writing", async () => {
    const storage = { save: vi.fn() };
    const repository = { create: vi.fn() };
    const service = createPlatformPageImageService({ storage, repository });

    await expect(
      service.upload({
        bytes: await createTestJpeg(),
        mimeType: "image/jpeg",
        originalName: "photo.jpg",
        focusX: 2,
        focusY: 0.5,
        zoom: 1,
      }),
    ).rejects.toThrow("موضع القص غير صالح");
    expect(storage.save).not.toHaveBeenCalled();
  });
});
