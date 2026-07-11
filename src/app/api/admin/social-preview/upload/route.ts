import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  getPlatformSocialPreviewSettings,
  savePlatformSocialPreviewSettings,
} from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "اختر صورة صالحة للرفع." }, { status: 400 });
    }

    const current = await getPlatformSocialPreviewSettings();
    const imageData = Buffer.from(await file.arrayBuffer()).toString("base64");
    const saved = await savePlatformSocialPreviewSettings({
      ...current,
      imageUrl: PLATFORM_SOCIAL_IMAGE,
      storageKey: null,
      imageData,
      imageMimeType: file.type,
    });

    const version = saved.updatedAt.getTime();
    return NextResponse.json({
      ok: true,
      imageUrl: `${PLATFORM_SOCIAL_IMAGE}?mode=custom&v=${version}`,
      version: String(version),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة حاليًا.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
