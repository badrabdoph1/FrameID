import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCustomerIssueService } from "@/modules/customer-issues/customer-issue-service";
import { resolveTrustedIssueContext } from "@/modules/customer-issues/context";
import { createPrismaCustomerIssueRepository } from "@/modules/customer-issues/prisma-customer-issue-repository";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

const ALLOWED_CATEGORIES = new Set(["rendering-report", "client-error"]);

type JsonScalar = string | number | boolean;
const issueService = createCustomerIssueService(createPrismaCustomerIssueRepository(prisma));

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
  const context = await resolveTrustedIssueContext(request);
  await issueService.captureOccurrence({
    category: isRenderingReport ? "CLIENT_RENDERING" : "CLIENT_ERROR",
    level: isRenderingReport ? "WARN" : "ERROR",
    code: text(body.code, 120) ?? (isRenderingReport ? "FID-RENDER-001" : "FID-CLIENT-001"),
    errorType: isRenderingReport ? "RenderingDiagnostic" : "ClientError",
    message,
    requestId: context.requestId,
    correlationId: context.correlationId,
    route: typeof metadata.route === "string" ? metadata.route.slice(0, 500) : context.route,
    method: context.method,
    url: context.url,
    stack,
    userId: session.user.id,
    tenantId: session.tenant.id,
    siteId: session.site.id,
    sessionId: context.sessionId,
    sourceArea: "CUSTOMER_DASHBOARD",
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    browser: typeof metadata.browserName === "string" ? metadata.browserName : null,
    device: typeof metadata.model === "string" ? metadata.model : null,
    os: typeof metadata.platform === "string" ? metadata.platform : null,
    environment: context.environment,
    releaseVersion: context.releaseVersion,
    buildVersion: context.buildVersion,
    templateCode: context.templateCode,
    metadata: {
      siteSlug: session.site.slug,
      diagnosticType: category,
      rendering: metadata,
    },
  });

  return NextResponse.json({ ok: true });
}
