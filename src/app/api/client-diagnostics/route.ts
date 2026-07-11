import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

const ALLOWED_CATEGORIES = new Set(["rendering-report", "client-error"]);

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : null;
}

function sanitizeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const allowedKeys = [
    "deviceId",
    "userAgent",
    "platform",
    "platformVersion",
    "manufacturer",
    "model",
    "androidVersion",
    "browserName",
    "browserVersion",
    "webViewVersion",
    "pwaInstalled",
    "safeRenderingEnabled",
    "safeRenderingReason",
    "backdropFilterSupported",
    "backdropFilterInUse",
    "backdropFilterLayerCount",
    "devicePixelRatio",
    "screenWidth",
    "screenHeight",
    "viewportWidth",
    "viewportHeight",
    "colorDepth",
    "hardwareConcurrency",
    "deviceMemory",
    "maxTouchPoints",
    "gpuVendor",
    "gpuRenderer",
    "route",
  ];

  return Object.fromEntries(
    allowedKeys
      .filter((key) => key in source)
      .map((key) => [key, typeof source[key] === "string" ? String(source[key]).slice(0, 1024) : source[key]]),
  );
}

export async function POST(request: Request) {
  const session = await getCurrentRequestSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = text(body.category, 64);
  const message = text(body.message, 2000);
  if (!category || !ALLOWED_CATEGORIES.has(category) || !message) {
    return NextResponse.json({ error: "Invalid diagnostic payload" }, { status: 400 });
  }

  const isRenderingReport = category === "rendering-report";
  const metadata = sanitizeMetadata(body.metadata);

  await prisma.errorLog.create({
    data: {
      category: isRenderingReport ? "CLIENT_RENDERING" : "CLIENT_ERROR",
      level: isRenderingReport ? "WARN" : "ERROR",
      code: text(body.code, 120) ?? (isRenderingReport ? "FID-RENDER-001" : "FID-CLIENT-001"),
      message,
      route: text(metadata.route, 500),
      userId: session.user.id,
      metadata: {
        tenantId: session.tenant.id,
        siteId: session.site.id,
        siteSlug: session.site.slug,
        diagnosticType: category,
        stack: text(body.stack, 8000),
        rendering: metadata,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
