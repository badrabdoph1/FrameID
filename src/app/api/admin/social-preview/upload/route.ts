import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  getPlatformSocialPreviewSettings,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_CUSTOM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "اختر صورة صالحة للرفع." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "نوع الصورة غير مدعوم." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "حجم الصورة بعد القص يجب ألا يتجاوز 2MB." }, { status: 400 });
    }

    const current = await getPlatformSocialPreviewSettings();
    const imageData = Buffer.from(await file.arrayBuffer()).toString("base64");
    await savePlatformSocialPreviewSettings({
      ...current,
      imageUrl: PLATFORM_CUSTOM_SOCIAL_IMAGE,
      storageKey: null,
      imageData,
      imageMimeType: file.type,
    });

    return NextResponse.json({
      ok: true,
      imageUrl: `${PLATFORM_CUSTOM_SOCIAL_IMAGE}?v=${Date.now()}`,
    });
  } catch (error) {
    console.error("[social-preview] upload failed", error);
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة حاليًا.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
