import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import type { PlatformSocialPreviewSettings } from "@/modules/social-preview/social-preview";

export const PLATFORM_SOCIAL_PREVIEW_KEY = "platform.social-preview";
export const PLATFORM_SOCIAL_PREVIEW_CACHE_TAG = "platform-social-preview";

const DEFAULT_SETTINGS: PlatformSocialPreviewSettings = {
  enabled: false,
  title: null,
  description: null,
  imageUrl: null,
  storageKey: null,
  imageData: null,
  imageMimeType: null,
};

type StoredValue = Partial<Record<keyof PlatformSocialPreviewSettings, unknown>>;

function parseValue(value: unknown, enabled: boolean): PlatformSocialPreviewSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SETTINGS, enabled };
  }

  const record = value as StoredValue;
  return {
    enabled,
    title: readText(record.title),
    description: readText(record.description),
    imageUrl: readText(record.imageUrl),
    storageKey: readText(record.storageKey),
    imageData: readText(record.imageData),
    imageMimeType: readText(record.imageMimeType),
  };
}

async function readRow() {
  return prisma.featureFlag.findFirst({
    where: {
      key: PLATFORM_SOCIAL_PREVIEW_KEY,
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
    } as never,
    select: { id: true, enabled: true, value: true },
  });
}

export const getPlatformSocialPreviewSettings = unstable_cache(
  async () => {
    const row = await readRow();
    return row ? parseValue(row.value, row.enabled) : DEFAULT_SETTINGS;
  },
  [PLATFORM_SOCIAL_PREVIEW_KEY],
  { tags: [PLATFORM_SOCIAL_PREVIEW_CACHE_TAG] },
);

export async function savePlatformSocialPreviewSettings(settings: PlatformSocialPreviewSettings) {
  const existing = await readRow();
  const value = {
    title: settings.title,
    description: settings.description,
    imageUrl: settings.imageUrl,
    storageKey: settings.storageKey,
  };

  if (existing) {
    await prisma.featureFlag.update({
      where: { id: existing.id },
      data: { enabled: settings.enabled, value } as never,
    });
  } else {
    await prisma.featureFlag.create({
      data: {
        key: PLATFORM_SOCIAL_PREVIEW_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
        enabled: settings.enabled,
        value,
      } as never,
    });
  }
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
