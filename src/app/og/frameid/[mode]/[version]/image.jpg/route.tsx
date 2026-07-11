import { getContent } from "@/lib/content";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ mode: string; version: string }>;
};

const COMMON_HEADERS = {
  "Content-Type": "image/jpeg",
  "Content-Disposition": "inline; filename=frameid-social-preview.jpg",
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
} as const;

export async function GET(_request: Request, context: RouteContext) {
  const { mode } = await context.params;
  const settings = await getPlatformSocialPreviewSettings();

  if (mode === "custom" && settings.imageData) {
    const bytes = Buffer.from(settings.imageData, "base64");
    if (bytes.byteLength > 0) {
      return new Response(bytes, {
        status: 200,
        headers: {
          ...COMMON_HEADERS,
          "Content-Length": String(bytes.byteLength),
        },
      });
    }
  }

  const homepage = getContent("marketing/homepage");
  const heroUrl = buildHeroJpegUrl(homepage.hero.heroImage);
  const upstream = await fetch(heroUrl, {
    cache: "no-store",
    headers: {
      Accept: "image/jpeg,image/*;q=0.8",
      "User-Agent": "FrameID-SocialPreview/1.0",
    },
  });

  if (!upstream.ok) {
    return new Response("Social preview image unavailable", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength === 0) {
    return new Response("Social preview image empty", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      ...COMMON_HEADERS,
      "Content-Length": String(bytes.byteLength),
    },
  });
}

function buildHeroJpegUrl(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.set("w", "1200");
    url.searchParams.set("h", "630");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "center");
    url.searchParams.set("q", "88");
    url.searchParams.set("fm", "jpg");
    return url.toString();
  } catch {
    return value;
  }
}
