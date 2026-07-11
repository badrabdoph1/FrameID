"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  DEFAULT_PLATFORM_SOCIAL_PREVIEW,
  normalizePlatformSocialPreview,
  PLATFORM_SOCIAL_PREVIEW_FLAG_KEY,
} from "@/modules/seo/platform-social-preview";

function readText(formData: FormData, key: string, fallback: string): string {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function saveSocialPreviewAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const existing = await prisma.featureFlag.findFirst({
    where: {
      key: PLATFORM_SOCIAL_PREVIEW_FLAG_KEY,
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
    },
    select: { id: true, enabled: true, value: true },
  });

  const current = existing
    ? normalizePlatformSocialPreview({
        ...(isRecord(existing.value) ? existing.value : {}),
        enabled: existing.enabled,
      })
    : DEFAULT_PLATFORM_SOCIAL_PREVIEW;

  const uploadedFile = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";
  let imageUrl = removeImage ? null : current.imageUrl;

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    const uploaded = await uploadPlatformTemplateImage(uploadedFile);
    imageUrl = uploaded.url;
  }

  const settings = normalizePlatformSocialPreview({
    enabled: formData.get("enabled") === "on",
    title: readText(formData, "title", DEFAULT_PLATFORM_SOCIAL_PREVIEW.title),
    description: readText(
      formData,
      "description",
      DEFAULT_PLATFORM_SOCIAL_PREVIEW.description,
    ),
    imageUrl,
  });

  const value = {
    title: settings.title,
    description: settings.description,
    imageUrl: settings.imageUrl,
  } as Prisma.InputJsonObject;

  const saved = existing
    ? await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { enabled: settings.enabled, value },
      })
    : await prisma.featureFlag.create({
        data: {
          key: PLATFORM_SOCIAL_PREVIEW_FLAG_KEY,
          scope: "PLATFORM",
          tenantId: null,
          siteId: null,
          enabled: settings.enabled,
          value,
        },
      });

  await prisma.auditLog.create({
    data: {
      action: "PLATFORM_SOCIAL_PREVIEW_UPDATED",
      entityType: "FeatureFlag",
      entityId: saved.id,
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        enabled: settings.enabled,
        hasCustomImage: Boolean(settings.imageUrl),
      } as Prisma.InputJsonObject,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/templates");
  revalidatePath("/admin/social-preview");
  redirect("/admin/social-preview?saved=1");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
