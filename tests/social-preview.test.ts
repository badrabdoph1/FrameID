import { describe, expect, it } from "vitest";

import {
  buildSocialMetadata,
  PHOTOGRAPHER_PLACEHOLDER_IMAGE,
  resolvePhotographerSocialPreview,
  resolvePlatformSocialPreview,
  type SocialPreviewImageProvider,
} from "@/modules/social-preview/social-preview";

describe("platform social preview", () => {
  it("uses the custom platform preview only when enabled and image data exists", () => {
    const preview = resolvePlatformSocialPreview({
      kind: "platform",
      defaults: {
        title: "FrameID",
        description: "Default description",
        imageUrl: "/opengraph-image",
      },
      settings: {
        enabled: true,
        title: "Custom title",
        description: "Custom description",
        imageUrl: "/uploads/custom.webp",
        storageKey: "platform/social-preview/custom.webp",
        imageData: "base64-encoded-image-data",
        imageMimeType: "image/webp",
        imageVersion: "12345",
      },
    });

    expect(preview.title).toBe("Custom title");
    expect(preview.description).toBe("Custom description");
    expect(preview.image.source).toBe("platform-custom");
  });

  it("falls back to the default platform preview when custom is disabled", () => {
    const preview = resolvePlatformSocialPreview({
      kind: "platform",
      defaults: {
        title: "FrameID",
        description: "Default description",
        imageUrl: "/opengraph-image",
      },
      settings: {
        enabled: false,
        title: "Ignored",
        description: "Ignored",
        imageUrl: "/uploads/custom.webp",
        storageKey: null,
      },
    });

    expect(preview.title).toBe("Ignored");
    expect(preview.image.source).toBe("platform-default");
  });
});

describe("photographer social preview", () => {
  it("prefers profile photo over hero cover", () => {
    const preview = resolvePhotographerSocialPreview({
      kind: "photographer",
      title: "Studio",
      description: "Photographer description",
      profilePhotoUrl: "/profile.webp",
      heroCoverUrl: "/hero.webp",
    });

    expect(preview.image.url).toBe("/profile.webp");
    expect(preview.image.source).toBe("profile-photo");
  });

  it("uses hero cover when the profile photo is missing", () => {
    const preview = resolvePhotographerSocialPreview({
      kind: "photographer",
      title: "Studio",
      description: "Photographer description",
      profilePhotoUrl: null,
      heroCoverUrl: "/hero.webp",
    });

    expect(preview.image.url).toBe("/hero.webp");
    expect(preview.image.source).toBe("hero-cover");
  });

  it("uses a neutral photographer placeholder and never the platform preview", () => {
    const preview = resolvePhotographerSocialPreview({
      kind: "photographer",
      title: "Studio",
      description: "Photographer description",
      profilePhotoUrl: null,
      heroCoverUrl: null,
    });

    expect(preview.image.url).toBe(PHOTOGRAPHER_PLACEHOLDER_IMAGE);
    expect(preview.image.source).toBe("photographer-placeholder");
    expect(preview.image.url).not.toBe("/opengraph-image");
  });

  it("accepts a future dynamic provider without changing the public resolver", () => {
    const dynamicProvider: SocialPreviewImageProvider<{
      kind: "photographer";
      title: string;
      description: string;
      profilePhotoUrl: string | null;
      heroCoverUrl: string | null;
    }> = {
      resolve(context) {
        return {
          url: `/api/og/${encodeURIComponent(context.title)}`,
          width: 1200,
          height: 630,
          alt: context.title,
          source: "dynamic",
        };
      },
    };

    const preview = resolvePhotographerSocialPreview(
      {
        kind: "photographer",
        title: "Dynamic Studio",
        description: "Description",
        profilePhotoUrl: null,
        heroCoverUrl: null,
      },
      [dynamicProvider],
    );

    expect(preview.image.source).toBe("dynamic");
  });

  it("keeps Open Graph and Twitter on the same image", () => {
    const preview = resolvePhotographerSocialPreview({
      kind: "photographer",
      title: "Studio",
      description: "Description",
      profilePhotoUrl: "/profile.webp",
      heroCoverUrl: null,
    });
    const metadata = buildSocialMetadata({
      preview,
      canonicalUrl: "https://frameid.app/p/studio",
      siteName: "Studio",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/profile.webp",
        secureUrl: "/profile.webp",
        width: 1200,
        height: 630,
        alt: "Studio",
        type: "image/jpeg",
      },
    ]);
    expect(metadata.twitter?.images).toEqual(["/profile.webp"]);
  });
});
