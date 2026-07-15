import "server-only";

import { prisma } from "@/lib/prisma";

export const PLATFORM_SOCIAL_PREVIEW_FLAG_KEY = "platform.social-preview";
const LEGACY_PLATFORM_SOCIAL_PREVIEW_FLAG_KEY = "platform-social-preview";

export type PlatformSocialPreviewSettings = {
  enabled: boolean;
  title: string;
  description: string;
  imageUrl: string | null;
};

export const DEFAULT_PLATFORM_SOCIAL_PREVIEW: PlatformSocialPreviewSettings = {
  enabled: false,
  title: "FrameID | موقع احترافي لكل مصور",
  description:
    "FrameID منصة عربية للمصورين تساعدك تنشئ موقعًا احترافيًا ورابطًا واحدًا يجمع صورك وباقاتك وأسعارك وبيانات التواصل.",
  imageUrl: null,
};

export function normalizePlatformSocialPreview(value: unknown): PlatformSocialPreviewSettings {
  const source = isRecord(value) ? value : {};
  return {
    enabled: source.enabled === true,
    title: readText(source.title, DEFAULT_PLATFORM_SOCIAL_PREVIEW.title),
    description: readText(source.description, DEFAULT_PLATFORM_SOCIAL_PREVIEW.description),
    imageUrl: readOptionalText(source.imageUrl),
  };
}

export async function loadPlatformSocialPreview(): Promise<PlatformSocialPreviewSettings> {
  if (process.env.NODE_ENV === "test") return DEFAULT_PLATFORM_SOCIAL_PREVIEW;

  try {
    const row = await prisma.featureFlag.findFirst({
      where: {
        key: PLATFORM_SOCIAL_PREVIEW_FLAG_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
      },
      select: { enabled: true, value: true },
    });

    if (row) {
      return normalizePlatformSocialPreview({
        ...(isRecord(row.value) ? row.value : {}),
        enabled: row.enabled,
      });
    }

    const legacyRow = await prisma.featureFlag.findFirst({
      where: {
        key: LEGACY_PLATFORM_SOCIAL_PREVIEW_FLAG_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
      },
      select: { enabled: true, value: true },
    });

    if (legacyRow) {
      return normalizePlatformSocialPreview({
        ...(isRecord(legacyRow.value) ? legacyRow.value : {}),
        enabled: legacyRow.enabled,
      });
    }

    return DEFAULT_PLATFORM_SOCIAL_PREVIEW;
  } catch {
    return DEFAULT_PLATFORM_SOCIAL_PREVIEW;
  }
}

export function resolvePlatformSocialImage(settings: PlatformSocialPreviewSettings): string {
  return settings.enabled && settings.imageUrl ? settings.imageUrl : "/opengraph-image";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
