import type { Metadata } from "next";

export const PLATFORM_SOCIAL_IMAGE = "https://frameid.app/og/frameid";
export const PLATFORM_DEFAULT_SOCIAL_IMAGE = buildPlatformSocialImageUrl("default", "default-v4");
export const PLATFORM_CUSTOM_SOCIAL_IMAGE = buildPlatformSocialImageUrl("custom", "current");
export const PHOTOGRAPHER_PLACEHOLDER_IMAGE = "/photographer-placeholder";

export type PlatformSocialImageMode = "default" | "custom";

export function buildPlatformSocialImageUrl(mode: PlatformSocialImageMode, version: string | number): string {
  const safeVersion = encodeURIComponent(String(version || "current"));
  return `${PLATFORM_SOCIAL_IMAGE}/${mode}/${safeVersion}/image.jpg`;
}

export type SocialPreviewImageSource =
  | "platform-custom"
  | "platform-default"
  | "profile-photo"
  | "hero-cover"
  | "photographer-placeholder"
  | "dynamic";

export type ResolvedSocialPreviewImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  source: SocialPreviewImageSource;
};

export type ResolvedSocialPreview = {
  title: string;
  description: string;
  image: ResolvedSocialPreviewImage;
};

export type PlatformSocialPreviewSettings = {
  enabled: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  storageKey: string | null;
  imageData?: string | null;
  imageMimeType?: string | null;
  imageVersion?: string | null;
};

export type PlatformSocialPreviewContext = {
  kind: "platform";
  defaults: { title: string; description: string; imageUrl: string };
  settings: PlatformSocialPreviewSettings;
};

export type PhotographerSocialPreviewContext = {
  kind: "photographer";
  title: string;
  description: string;
  profilePhotoUrl: string | null;
  heroCoverUrl: string | null;
};

export type SocialPreviewContext = PlatformSocialPreviewContext | PhotographerSocialPreviewContext;

export interface SocialPreviewImageProvider<TContext extends SocialPreviewContext = SocialPreviewContext> {
  resolve(context: TContext): ResolvedSocialPreviewImage | null;
}

const platformProviders: Array<SocialPreviewImageProvider<PlatformSocialPreviewContext>> = [
  {
    resolve(context) {
      if (!context.settings.enabled || !context.settings.imageData) return null;
      const version = context.settings.imageVersion ?? "custom";
      return image(buildPlatformSocialImageUrl("custom", version), "platform-custom", context.settings.title ?? context.defaults.title);
    },
  },
  {
    resolve(context) {
      const version = context.settings.imageVersion ?? "default-v4";
      return image(buildPlatformSocialImageUrl("default", version), "platform-default", context.settings.title ?? context.defaults.title);
    },
  },
];

const photographerProviders: Array<SocialPreviewImageProvider<PhotographerSocialPreviewContext>> = [
  { resolve(context) { return isUsableUrl(context.profilePhotoUrl) ? image(context.profilePhotoUrl, "profile-photo", context.title) : null; } },
  { resolve(context) { return isUsableUrl(context.heroCoverUrl) ? image(context.heroCoverUrl, "hero-cover", context.title) : null; } },
  { resolve(context) { return image(PHOTOGRAPHER_PLACEHOLDER_IMAGE, "photographer-placeholder", context.title); } },
];

export function resolvePlatformSocialPreview(context: PlatformSocialPreviewContext): ResolvedSocialPreview {
  return {
    title: context.settings.title ?? context.defaults.title,
    description: context.settings.description ?? context.defaults.description,
    image: firstResolved(platformProviders, context),
  };
}

export function resolvePhotographerSocialPreview(
  context: PhotographerSocialPreviewContext,
  providers: Array<SocialPreviewImageProvider<PhotographerSocialPreviewContext>> = photographerProviders,
): ResolvedSocialPreview {
  return { title: context.title, description: context.description, image: firstResolved(providers, context) };
}

export function buildSocialMetadata({ preview, canonicalUrl, siteName, locale = "ar_EG" }: {
  preview: ResolvedSocialPreview;
  canonicalUrl: string;
  siteName?: string;
  locale?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website", locale, siteName, url: canonicalUrl,
      title: preview.title, description: preview.description,
      images: [{ url: preview.image.url, secureUrl: preview.image.url, width: preview.image.width, height: preview.image.height, alt: preview.image.alt, type: "image/jpeg" }],
    },
    twitter: { card: "summary_large_image", title: preview.title, description: preview.description, images: [preview.image.url] },
  };
}

function firstResolved<TContext extends SocialPreviewContext>(providers: Array<SocialPreviewImageProvider<TContext>>, context: TContext): ResolvedSocialPreviewImage {
  for (const provider of providers) {
    const result = provider.resolve(context);
    if (result) return result;
  }
  throw new Error("Social preview provider chain did not produce an image.");
}

function image(url: string, source: SocialPreviewImageSource, alt: string): ResolvedSocialPreviewImage {
  return { url, width: 1200, height: 630, alt, source };
}

function isUsableUrl(value: string | null): value is string { return Boolean(value?.trim()); }
