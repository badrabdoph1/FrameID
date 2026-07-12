"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { uploadPlatformSocialPreviewImage } from "@/modules/media/platform-image-upload";
import {
  getPlatformSocialPreviewSettings,
  PLATFORM_SOCIAL_PREVIEW_CACHE_TAG,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";

const PAGE_PATH = "/admin/settings/social-preview";

type PreviewMode = "default" | "custom";

export async function savePlatformSocialPreviewAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const current = await getPlatformSocialPreviewSettings();
  const mode = readMode(formData);
  const removeImage = formData.get("removeImage") === "true";
  const title = readOptionalText(formData, "title", 120);
  const description = readOptionalText(formData, "description", 240);
  const file = formData.get("previewImage");

  try {
    let imageUrl = removeImage ? null : current.imageUrl;
    let storageKey = removeImage ? null : current.storageKey;

    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadPlatformSocialPreviewImage(file);
      imageUrl = uploaded.url;
      storageKey = uploaded.storageKey;
    }

    if (mode === "custom" && !imageUrl) {
      throw new Error("اختر صورة مخصصة أولًا، ثم احفظ الإعدادات.");
    }

    await savePlatformSocialPreviewSettings({
      enabled: mode === "custom",
      title,
      description,
      imageUrl,
      storageKey,
    });

    await prisma.auditLog.create({
      data: {
        action: "PLATFORM_SOCIAL_PREVIEW_UPDATED",
        entityType: "FeatureFlag",
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          mode,
          title,
          description,
          imageUrl,
          removedImage: removeImage,
        } as never,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "savePlatformSocialPreview", mode },
    });
    redirect(`${PAGE_PATH}?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/templates");
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?saved=1&mode=${mode}`);
}

export async function uploadSocialPreviewImageAction(
  formData: FormData
): Promise<{ ok: boolean; message: string; imageUrl?: string; bytes?: number }> {
  const session = await requireSuperAdminSession();

  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, message: "اختر صورة صالحة للرفع." };
  }

  try {
    const uploaded = await uploadPlatformSocialPreviewImage(image);

    const current = await getPlatformSocialPreviewSettings();
    await savePlatformSocialPreviewSettings({
      ...current,
      enabled: true,
      imageUrl: uploaded.url,
      storageKey: uploaded.storageKey,
    });

    revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/templates");

    return {
      ok: true,
      message: "تم رفع الصورة وتثبيتها بنجاح.",
      imageUrl: uploaded.url,
      bytes: image.size,
    };
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "uploadSocialPreviewImage" },
    });
    return { ok: false, message: userError.message };
  }
}

function readMode(formData: FormData): PreviewMode {
  return formData.get("mode") === "custom" ? "custom" : "default";
}

function readOptionalText(formData: FormData, key: string, maxLength: number): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || null;
}