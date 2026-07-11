import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { uploadPlatformSocialPreviewImage } from "@/modules/media/platform-image-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireSuperAdminSession();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "اختر صورة صالحة للرفع." }, { status: 400 });
    }

    const uploaded = await uploadPlatformSocialPreviewImage(file);
    return NextResponse.json({ ok: true, imageUrl: uploaded.url, storageKey: uploaded.storageKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر رفع الصورة حاليًا.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
