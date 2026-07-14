import { getContent } from "@/lib/content";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ mode: string; version: string }>;
};

type ResolvedImage = {
  bytes: ArrayBuffer;
  contentType: string;
  etag: string;
};

const COMMON_HEADERS = {
  "Content-Disposition": "inline; filename=frameid-social-preview.jpg",
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Accept-Ranges": "bytes",
} as const;

export async function GET(request: Request, context: RouteContext) {
  try {
    const image = await resolveImage(request, context);
    return new Response(image.bytes, {
      status: 200,
      headers: {
        ...COMMON_HEADERS,
        "Content-Type": image.contentType,
        "Content-Length": String(image.bytes.byteLength),
        "ETag": image.etag,
      },
    });
  } catch (error) {
    console.error("[frameid-og-image] GET failed", error);
    return unavailableResponse();
  }
}

export async function HEAD(request: Request, context: RouteContext) {
  try {
    const image = await resolveImage(request, context);
    return new Response(null, {
      status: 200,
      headers: {
        ...COMMON_HEADERS,
        "Content-Type": image.contentType,
        "Content-Length": String(image.bytes.byteLength),
        "ETag": image.etag,
      },
    });
  } catch (error) {
    console.error("[frameid-og-image] HEAD failed", error);
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

async function resolveImage(request: Request, context: RouteContext): Promise<ResolvedImage> {
  const { mode, version } = await context.params;
  if (mode !== "default" && mode !== "custom") {
    throw new Error(`Unsupported social image mode: ${mode}`);
  }

  const settings = await getPlatformSocialPreviewSettings();
  if (mode === "custom" && settings.imageData) {
    const buffer = Buffer.from(settings.imageData, "base64");
    if (buffer.byteLength > 0) {
      return {
        bytes: toArrayBuffer(buffer),
        contentType: settings.imageMimeType || "image/jpeg",
        etag: `"custom-${version}-${buffer.byteLength}"`,
      };
    }
  }

  const homepage = getContent("marketing/homepage");
  const hero = await fetchImage(buildHeroJpegUrl(homepage.hero.heroImage));
  if (hero) {
    return {
      bytes: hero.bytes,
      contentType: hero.contentType,
      etag: `"hero-${version}-${hero.bytes.byteLength}"`,
    };
  }

  const origin = new URL(request.url).origin;
  const fallback = await fetchImage(`${origin}/opengraph-image`, "FrameID-SocialPreview-Fallback/1.0");
  if (fallback) {
    return {
      bytes: fallback.bytes,
      contentType: fallback.contentType,
      etag: `"fallback-${version}-${fallback.bytes.byteLength}"`,
    };
  }

  const placeholder = await fetchImage(`${origin}/photographer-placeholder`, "FrameID-SocialPreview-Placeholder/1.0");
  if (placeholder) {
    return {
      bytes: placeholder.bytes,
      contentType: placeholder.contentType,
      etag: `"placeholder-${placeholder.bytes.byteLength}"`,
    };
  }

  throw new Error("All social image sources are unavailable");
}

async function fetchImage(url: string, userAgent = "FrameID-SocialPreview/1.0"): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const bytes = await response.arrayBuffer();
    return bytes.byteLength > 0 ? { bytes, contentType } : null;
  } catch {
    return null;
  }
}

function unavailableResponse() {
  return new Response("Social preview image unavailable", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
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
