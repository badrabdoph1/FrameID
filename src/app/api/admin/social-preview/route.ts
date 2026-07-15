import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  getPlatformSocialPreviewSettings,
  PLATFORM_SOCIAL_PREVIEW_CACHE_TAG,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_CUSTOM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const runtime = "nodejs";

type Payload = {
  mode?: "default" | "custom";
  title?: string | null;
  description?: string | null;
  deleteImage?: boolean;
};

export async function PATCH(request: Request) {
  try {
    const session = await requireSuperAdminSession();
    const payload = (await request.json()) as Payload;
    const current = await getPlatformSocialPreviewSettings();
    const mode = payload.mode === "custom" ? "custom" : "default";
    const deleteImage = payload.deleteImage === true;

    const imageBump = Date.now().toString(36);
    const next = {
      ...current,
      enabled: mode === "custom",
      title: cleanText(payload.title, 120),
      description: cleanText(payload.description, 240),
      imageUrl: deleteImage
        ? null
        : current.imageData
          ? PLATFORM_CUSTOM_SOCIAL_IMAGE
          : current.imageUrl,
      storageKey: deleteImage ? null : current.storageKey,
      imageData: deleteImage ? null : current.imageData,
      imageMimeType: deleteImage ? null : current.imageMimeType,
      imageVersion: deleteImage || mode === "default" ? null : (current.imageVersion ?? imageBump),
    };

    const hasImage = Boolean(next.imageUrl || next.imageData);
    if (mode === "custom" && !hasImage) {
      return NextResponse.json({ ok: false, error: "لا توجد صورة مرفوعة فعلًا. ارفع الصورة واعتمد القص أولًا." }, { status: 400 });
    }

    await savePlatformSocialPreviewSettings(next);
    await prisma.auditLog.create({
      data: {
        action: "PLATFORM_SOCIAL_PREVIEW_UPDATED",
        entityType: "FeatureFlag",
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          mode,
          title: next.title,
          description: next.description,
          hasImage: Boolean(next.imageUrl || next.imageData),
          deletedImage: deleteImage,
        } as Prisma.InputJsonObject,
      },
    });

    revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/templates");
    revalidatePath("/admin/social-preview");
    revalidatePath("/admin/settings/social-preview");

    return NextResponse.json({
      ok: true,
      settings: {
        enabled: next.enabled,
        title: next.title,
        description: next.description,
        imageUrl: next.imageUrl ? `${next.imageUrl}${next.imageUrl.includes("?") ? "&" : "?"}v=${Date.now()}` : null,
        hasImage: Boolean(next.imageUrl || next.imageData),
      },
    });
  } catch (error) {
    console.error("[social-preview] save failed", error);
    const message = error instanceof Error ? error.message : "تعذر حفظ إعدادات معاينة المشاركة.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || null;
}
