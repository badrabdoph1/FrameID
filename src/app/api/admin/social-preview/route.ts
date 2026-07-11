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
import { PLATFORM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const next = {
      ...current,
      enabled: mode === "custom",
      title: cleanText(payload.title, 120),
      description: cleanText(payload.description, 240),
      imageUrl: deleteImage ? null : current.imageData ? PLATFORM_SOCIAL_IMAGE : null,
      storageKey: null,
      imageData: deleteImage ? null : current.imageData,
      imageMimeType: deleteImage ? null : current.imageMimeType,
    };

    if (mode === "custom" && (!next.imageData || !next.imageMimeType)) {
      return NextResponse.json({ ok: false, error: "لا توجد صورة مرفوعة فعليًا. ارفع الصورة واعتمد القص أولًا." }, { status: 400 });
    }

    const saved = await savePlatformSocialPreviewSettings(next);
    const persisted = await getPlatformSocialPreviewSettings();

    if (persisted.enabled !== next.enabled) {
      throw new Error("تعذر تأكيد وضع صورة المشاركة بعد الحفظ.");
    }
    if (mode === "custom" && (!persisted.imageData || !persisted.imageMimeType)) {
      throw new Error("لم يتم العثور على الصورة المخصصة بعد الحفظ.");
    }
    if (deleteImage && persisted.imageData) {
      throw new Error("تعذر حذف الصورة المخصصة من التخزين.");
    }

    const version = saved.updatedAt.getTime();

    void writeAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email ?? null,
      mode,
      title: next.title,
      description: next.description,
      hasImage: Boolean(persisted.imageData),
      deletedImage: deleteImage,
      version,
    });

    safelyRevalidate();

    return NextResponse.json({
      ok: true,
      settings: {
        enabled: persisted.enabled,
        title: persisted.title,
        description: persisted.description,
        imageUrl: persisted.imageData ? `/social-preview-image?mode=custom&v=${version}` : null,
        defaultImageUrl: `/social-preview-image?mode=default&v=${version}`,
        hasImage: Boolean(persisted.imageData),
        version: String(version),
      },
    });
  } catch (error) {
    console.error("[social-preview] save failed", error);
    const message = error instanceof Error ? error.message : "تعذر حفظ إعدادات معاينة المشاركة.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function writeAuditLog(metadata: Prisma.InputJsonObject) {
  try {
    await prisma.auditLog.create({
      data: {
        action: "PLATFORM_SOCIAL_PREVIEW_UPDATED",
        entityType: "FeatureFlag",
        metadata,
      },
    });
  } catch (error) {
    console.error("[social-preview] audit log failed after successful save", error);
  }
}

function safelyRevalidate() {
  try {
    revalidateTag(PLATFORM_SOCIAL_PREVIEW_CACHE_TAG);
    revalidatePath("/", "layout");
    revalidatePath("/templates");
    revalidatePath("/admin/settings/social-preview");
  } catch (error) {
    console.error("[social-preview] cache revalidation failed after successful save", error);
  }
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || null;
}
