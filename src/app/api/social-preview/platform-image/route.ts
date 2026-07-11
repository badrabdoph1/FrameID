import { NextResponse } from "next/server";

import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const settings = await getPlatformSocialPreviewSettings();
  if (!settings.imageData || !settings.imageMimeType) {
    return NextResponse.redirect(new URL("/api/social-preview/default-image", request.url), 307);
  }

  const bytes = Uint8Array.from(Buffer.from(settings.imageData, "base64"));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": settings.imageMimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
