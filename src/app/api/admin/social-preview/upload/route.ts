import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  getPlatformSocialPreviewSettings,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();
    const formData = await request.formData();
    const file = formData.get("image");
    const width = Number(formData.get("width"));
    const height = Number(formData.get("height"));

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "اختر صورة صالحة للرفع." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "نوع الصورة غير مدعوم." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "حجم الصورة بعد القص يجب ألا يتجاوز 2MB." }, { status: 400 });
    }
    if (width !== 1200 || height !== 630) {
      return NextResponse.json({ ok: false, error: "الصورة النهائية يجب أن تكون 1200×630 بكسل." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const expectedHash = createHash("sha256").update(bytes).digest();
    const imageData = bytes.toString("base64");
    const current = await getPlatformSocialPreviewSettings();
    const saved = await savePlatformSocialPreviewSettings({
      ...current,
      imageUrl: PLATFORM_SOCIAL_IMAGE,
      storageKey: null,
      imageData,
      imageMimeType: file.type,
    });

    const persisted = await getPlatformSocialPreviewSettings();
    if (!persisted.imageData || persisted.imageMimeType !== file.type) {
      throw new Error("تم إرسال الصورة لكن تعذر تثبيتها في قاعدة البيانات.");
    }

    const persistedBytes = Buffer.from(persisted.imageData, "base64");
    const persistedHash = createHash("sha256").update(persistedBytes).digest();
    if (
      persistedBytes.byteLength !== bytes.byteLength ||
      persistedHash.byteLength !== expectedHash.byteLength ||
      !timingSafeEqual(persistedHash, expectedHash)
    ) {
      throw new Error("فشل التحقق من سلامة الصورة بعد تخزينها.");
    }

    const version = saved.updatedAt.getTime();
    return NextResponse.json({
      ok: true,
      imageUrl: `${PLATFORM_SOCIAL_IMAGE}?mode=custom&v=${version}`,
      version: String(version),
      bytes: persistedBytes.byteLength,
      sha256: persistedHash.toString("hex"),
      verified: true,
    });
  } catch (error) {
    console.error("[social-preview] upload failed", error);
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة حاليًا.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
