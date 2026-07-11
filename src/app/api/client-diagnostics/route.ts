import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

const ALLOWED_CATEGORIES = new Set(["rendering-report", "client-error"]);

type JsonScalar = string | number | boolean;
type MutableJsonObject = Record<string, JsonScalar | MutableJsonObject>;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength) : null;
}

function sanitizeJsonScalar(value: unknown): JsonScalar | undefined {
  if (typeof value === "string") return value.slice(0, 1024);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return undefined;
}

function sanitizeMetadata(value: unknown): Record<string, JsonScalar> {
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
  ] as const;

  const sanitized: Record<string, JsonScalar> = {};
  for (const key of allowedKeys) {
    const safeValue = sanitizeJsonScalar(source[key]);
    if (safeValue !== undefined) sanitized[key] = safeValue;
  }

  return sanitized;
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
  const stack = text(body.stack, 8000);
  const logMetadata: MutableJsonObject = {
    tenantId: session.tenant.id,
    siteId: session.site.id,
    siteSlug: session.site.slug,
    diagnosticType: category,
    rendering: metadata,
  };
  if (stack) logMetadata.stack = stack;

  await prisma.errorLog.create({
    data: {
      category: isRenderingReport ? "CLIENT_RENDERING" : "CLIENT_ERROR",
      level: isRenderingReport ? "WARN" : "ERROR",
      code: text(body.code, 120) ?? (isRenderingReport ? "FID-RENDER-001" : "FID-CLIENT-001"),
      message,
      route: typeof metadata.route === "string" ? metadata.route.slice(0, 500) : null,
      userId: session.user.id,
      metadata: logMetadata as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ ok: true });
}
