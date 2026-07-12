import type { Metadata } from "next";

export const PLATFORM_DEFAULT_SOCIAL_IMAGE = "/opengraph-image";
export const PLATFORM_CUSTOM_SOCIAL_IMAGE = "/social-preview-image.jpg";
export const PHOTOGRAPHER_PLACEHOLDER_IMAGE = "/photographer-placeholder";

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
};

export type PlatformSocialPreviewContext = {
  kind: "platform";
  defaults: {
    title: string;
    description: string;
    imageUrl: string;
  };
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
      if (!context.settings.enabled || !isUsableUrl(context.settings.imageUrl)) return null;
      return image(context.settings.imageUrl, "platform-custom", context.settings.title ?? context.defaults.title);
    },
  },
  {
    resolve(context) {
      return image(context.defaults.imageUrl, "platform-default", context.defaults.title);
    },
  },
];

const photographerProviders: Array<SocialPreviewImageProvider<PhotographerSocialPreviewContext>> = [
  {
    resolve(context) {
      return isUsableUrl(context.profilePhotoUrl)
        ? image(context.profilePhotoUrl, "profile-photo", context.title)
        : null;
    },
  },
  {
    resolve(context) {
      return isUsableUrl(context.heroCoverUrl)
        ? image(context.heroCoverUrl, "hero-cover", context.title)
        : null;
    },
  },
  {
    resolve(context) {
      return image(PHOTOGRAPHER_PLACEHOLDER_IMAGE, "photographer-placeholder", context.title);
    },
  },
];

export function resolvePlatformSocialPreview(context: PlatformSocialPreviewContext): ResolvedSocialPreview {
  const resolvedImage = firstResolved(platformProviders, context);
  return {
    title: context.settings.enabled && context.settings.title ? context.settings.title : context.defaults.title,
    description:
      context.settings.enabled && context.settings.description
        ? context.settings.description
        : context.defaults.description,
    image: resolvedImage,
  };
}

export function resolvePhotographerSocialPreview(
  context: PhotographerSocialPreviewContext,
  providers: Array<SocialPreviewImageProvider<PhotographerSocialPreviewContext>> = photographerProviders,
): ResolvedSocialPreview {
  return {
    title: context.title,
    description: context.description,
    image: firstResolved(providers, context),
  };
}

export function buildSocialMetadata({
  preview,
  canonicalUrl,
  siteName,
  locale = "ar_EG",
}: {
  preview: ResolvedSocialPreview;
  canonicalUrl: string;
  siteName?: string;
  locale?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale,
      siteName,
      url: canonicalUrl,
      title: preview.title,
      description: preview.description,
      images: [
        {
          url: preview.image.url,
          width: preview.image.width,
          height: preview.image.height,
          alt: preview.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: preview.title,
      description: preview.description,
      images: [preview.image.url],
    },
  };
}

function firstResolved<TContext extends SocialPreviewContext>(
  providers: Array<SocialPreviewImageProvider<TContext>>,
  context: TContext,
): ResolvedSocialPreviewImage {
  for (const provider of providers) {
    const result = provider.resolve(context);
    if (result) return result;
  }

  throw new Error("Social preview provider chain did not produce an image.");
}

function image(url: string, source: SocialPreviewImageSource, alt: string): ResolvedSocialPreviewImage {
  return { url, width: 1200, height: 630, alt, source };
}

function isUsableUrl(value: string | null): value is string {
  return Boolean(value?.trim());
}
