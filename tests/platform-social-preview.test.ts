import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLATFORM_SOCIAL_PREVIEW,
  normalizePlatformSocialPreview,
  resolvePlatformSocialImage,
} from "@/modules/seo/platform-social-preview";

describe("platform social preview", () => {
  it("normalizes custom title, description and image", () => {
    expect(normalizePlatformSocialPreview({
      enabled: true,
      title: " FrameID Custom ",
      description: " Custom description ",
      imageUrl: " https://example.com/social.jpg ",
    })).toEqual({
      enabled: true,
      title: "FrameID Custom",
      description: "Custom description",
      imageUrl: "https://example.com/social.jpg",
    });
  });

  it("returns official defaults for missing values", () => {
    expect(normalizePlatformSocialPreview({})).toEqual(DEFAULT_PLATFORM_SOCIAL_PREVIEW);
  });

  it("uses custom image only while enabled", () => {
    expect(resolvePlatformSocialImage({
      ...DEFAULT_PLATFORM_SOCIAL_PREVIEW,
      enabled: true,
      imageUrl: "https://example.com/social.jpg",
    })).toBe("https://example.com/social.jpg");

    expect(resolvePlatformSocialImage({
      ...DEFAULT_PLATFORM_SOCIAL_PREVIEW,
      enabled: false,
      imageUrl: "https://example.com/social.jpg",
    })).toBe("/frameid-social-preview.png");
  });
});
