import { ImageResponse } from "next/og";

import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  const settings = await getPlatformSocialPreviewSettings();
  const shouldUseCustom = requestedMode === "custom" || (requestedMode !== "default" && settings.enabled);

  if (shouldUseCustom && settings.imageData && settings.imageMimeType) {
    const bytes = Buffer.from(settings.imageData, "base64");
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": settings.imageMimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline; filename=frameid-social-preview.jpg",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg,#080808 0%,#18130c 58%,#b88a3f 150%)", color: "white", padding: 72 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>FrameID</div>
        <div style={{ border: "1px solid rgba(243,207,115,.5)", borderRadius: 999, padding: "14px 24px", color: "#f3cf73", fontSize: 24, fontWeight: 700 }}>Photography Platform</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ maxWidth: 900, fontSize: 70, lineHeight: 1.08, fontWeight: 800 }}>Your photography business in one professional link.</div>
        <div style={{ maxWidth: 850, color: "rgba(255,255,255,.72)", fontSize: 31, lineHeight: 1.45 }}>Portfolio, packages, pricing and contact details — beautifully organized and ready to share.</div>
      </div>
      <div style={{ display: "flex", gap: 18, color: "#f3cf73", fontSize: 26, fontWeight: 700 }}><span>Portfolio</span><span>•</span><span>Packages</span><span>•</span><span>Booking</span></div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        "Content-Disposition": "inline; filename=frameid-social-preview.png",
      },
    },
  );
}
