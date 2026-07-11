import { getContent } from "@/lib/content";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const COMMON_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Accept-Ranges": "bytes",
} as const;

type ResolvedImage = {
  bytes: ArrayBuffer;
  contentType: string;
  etag: string;
};

export async function GET(request: Request) {
  try {
    const image = await resolveImage(request);
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
    console.error("[social-preview-image.jpg] GET failed", error);
    return new Response("Social preview image unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}

export async function HEAD(request: Request) {
  try {
    const image = await resolveImage(request);
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
    console.error("[social-preview-image.jpg] HEAD failed", error);
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

async function resolveImage(request: Request): Promise<ResolvedImage> {
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  const settings = await getPlatformSocialPreviewSettings();
  const shouldUseCustom = requestedMode === "custom" || (requestedMode !== "default" && settings.enabled);

  if (shouldUseCustom && settings.imageData && settings.imageMimeType) {
    const buffer = Buffer.from(settings.imageData, "base64");
    if (buffer.byteLength > 0) {
      return {
        bytes: toArrayBuffer(buffer),
        contentType: settings.imageMimeType,
        etag: `"custom-${buffer.byteLength}"`,
      };
    }
  }

  const homepage = getContent("marketing/homepage");
  const upstream = await fetch(buildOpenGraphHeroUrl(homepage.hero.heroImage), {
    cache: "no-store",
    headers: {
      Accept: "image/jpeg,image/*;q=0.8",
      "User-Agent": "FrameID-SocialPreview/1.0",
    },
  });

  if (!upstream.ok) throw new Error(`Hero source returned ${upstream.status}`);
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("Hero source did not return an image");

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength === 0) throw new Error("Hero image is empty");

  return {
    bytes,
    contentType,
    etag: `\"hero-${homepage._version}-${bytes.byteLength}\"`,
  };
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
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
