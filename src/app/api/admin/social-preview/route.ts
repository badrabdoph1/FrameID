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

export const runtime = "nodejs";

type Payload = {
  mode?: "default" | "custom";
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  storageKey?: string | null;
  deleteImage?: boolean;
};

export async function PATCH(request: Request) {
  try {
    const session = await requireSuperAdminSession();
    const payload = (await request.json()) as Payload;
    const current = await getPlatformSocialPreviewSettings();
    const mode = payload.mode === "custom" ? "custom" : "default";
    const deleteImage = payload.deleteImage === true;

    const imageUrl = deleteImage ? null : cleanText(payload.imageUrl, 2048) ?? current.imageUrl;
    const storageKey = deleteImage ? null : cleanText(payload.storageKey, 1024) ?? current.storageKey;
    const title = cleanText(payload.title, 120);
    const description = cleanText(payload.description, 240);

    if (mode === "custom" && !imageUrl) {
      return NextResponse.json({ ok: false, error: "ارفع صورة مخصصة واعتمد القص قبل الحفظ." }, { status: 400 });
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
          deletedImage: deleteImage,
        } as Prisma.InputJsonObject,
      },
    });

    revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/templates");
    revalidatePath("/admin/settings/social-preview");

    return NextResponse.json({
      ok: true,
      settings: {
        enabled: mode === "custom",
        title,
        description,
        imageUrl,
        storageKey,
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
