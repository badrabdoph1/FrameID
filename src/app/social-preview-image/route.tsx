import { getContent } from "@/lib/content";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_HEADERS = {
  "Content-Disposition": "inline; filename=frameid-social-preview.jpg",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  const settings = await getPlatformSocialPreviewSettings();
  const shouldUseCustom = requestedMode === "custom" || (requestedMode !== "default" && settings.enabled);

  if (shouldUseCustom && settings.imageData && settings.imageMimeType) {
    const bytes = Buffer.from(settings.imageData, "base64");
    if (bytes.byteLength > 0) {
      return new Response(bytes, {
        status: 200,
        headers: {
          ...IMAGE_HEADERS,
          "Content-Type": settings.imageMimeType,
          "Content-Length": String(bytes.byteLength),
          "ETag": `\"custom-${settings.imageVersion ?? bytes.byteLength}\"`,
        },
      });
    }
  }

  const homepage = getContent("marketing/homepage");
  const heroUrl = buildOpenGraphHeroUrl(homepage.hero.heroImage);
  const upstream = await fetch(heroUrl, {
    cache: "no-store",
    headers: { Accept: "image/jpeg,image/*;q=0.8" },
  });

  if (!upstream.ok) {
    return new Response("Default hero image is unavailable", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return new Response("Default hero source did not return an image", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength === 0) {
    return new Response("Default hero image is empty", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      ...IMAGE_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "ETag": `\"hero-${homepage._version}-${bytes.byteLength}\"`,
    },
  });
}

function buildOpenGraphHeroUrl(value: string): string {
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
