"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { uploadPlatformSocialPreviewImage } from "@/modules/media/platform-image-upload";
import {
  getPlatformSocialPreviewSettings,
  PLATFORM_SOCIAL_PREVIEW_CACHE_TAG,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_CUSTOM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

const PAGE_PATH = "/admin/social-preview";

export async function savePlatformSocialPreviewAction() {
  const session = await requireSuperAdminSession();
  revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/templates");
  revalidatePath(PAGE_PATH);
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

    const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");

    const current = await getPlatformSocialPreviewSettings();
    await savePlatformSocialPreviewSettings({
      ...current,
      enabled: true,
      imageUrl: PLATFORM_CUSTOM_SOCIAL_IMAGE,
      storageKey: uploaded.storageKey,
      imageData,
      imageMimeType: image.type,
    });
    await syncPlatformConfigurationToGitHub({ actor: session.user, reason: "رفع صورة معاينة المنصة" });

    revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/templates");
    revalidatePath(PAGE_PATH);

    return {
      ok: true,
      message: "تم رفع الصورة وتثبيتها بنجاح.",
      imageUrl: `${PLATFORM_CUSTOM_SOCIAL_IMAGE}?mode=custom&v=${Date.now()}`,
      bytes: image.size,
    };
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "uploadSocialPreviewImage" },
    });
    return { ok: false, message: userError.message };
  }
}
