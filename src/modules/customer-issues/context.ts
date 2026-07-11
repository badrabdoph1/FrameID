import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens";
import type { ErrorSourceArea } from "./types";

export type TrustedIssueContext = {
  requestId: string;
  correlationId: string;
  route: string;
  method: string;
  url: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  tenantId: string | null;
  siteId: string | null;
  sessionId: string | null;
  adminUserId: string | null;
  sourceArea: ErrorSourceArea;
  environment: string;
  releaseVersion: string | null;
  buildVersion: string | null;
  templateCode: string | null;
};

function traceId(value: string | null): string {
  return value?.slice(0, 120) || crypto.randomUUID().slice(0, 12);
}

function routeFromRequest(request: Request): string {
  const headerRoute = request.headers.get("x-frameid-page") ?? request.headers.get("x-pathname");
  if (headerRoute && !headerRoute.startsWith("/api/customer-issues")) return headerRoute.slice(0, 1_000);
  const referrer = request.headers.get("referer");
  if (referrer) {
    try {
      const url = new URL(referrer);
      return `${url.pathname}${url.search}`.slice(0, 1_000);
    } catch {
      // Fall through to the request URL.
    }
  }
  return new URL(request.url).pathname;
}

function sourceAreaFor(route: string, adminUserId: string | null): ErrorSourceArea {
  if (adminUserId || route.startsWith("/admin")) return "ADMIN";
  if (route.startsWith("/dashboard")) return "CUSTOMER_DASHBOARD";
  if (route.startsWith("/p/")) return "PUBLIC_SITE";
  if (route.startsWith("/api/")) return "API";
  return "MARKETING";
}

function requestIp(headers: Headers): string | null {
  return (
    headers.get("cf-connecting-ip")
    ?? headers.get("x-real-ip")
    ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? null
  )?.slice(0, 80) ?? null;
}

async function resolveSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;
  const session = await prisma.session.findFirst({
    where: { tokenHash: hashSessionToken(rawToken), revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return session?.id ?? null;
}

async function resolvePublicSite(route: string) {
  if (!route.startsWith("/p/")) return null;
  const slug = route.replace(/^\/p\//, "").split(/[/?#]/)[0];
  if (!slug) return null;
  return prisma.site.findFirst({
    where: { slug, deletedAt: null, isPublished: true },
    select: { id: true, tenantId: true, templateCode: true },
  });
}

export async function resolveTrustedIssueContext(request: Request): Promise<TrustedIssueContext> {
  const route = routeFromRequest(request);
  const [session, admin, sessionId, publicSite] = await Promise.all([
    getCurrentRequestSession().catch(() => null),
    route.startsWith("/admin") ? getCurrentAdmin().catch(() => null) : Promise.resolve(null),
    resolveSessionId().catch(() => null),
    resolvePublicSite(route).catch(() => null),
  ]);
  const siteId = session?.site.id ?? publicSite?.id ?? null;
  const site = siteId
    ? await prisma.site.findUnique({ where: { id: siteId }, select: { templateCode: true } }).catch(() => null)
    : null;
  const requestId = traceId(request.headers.get("x-request-id"));
  const correlationId = traceId(request.headers.get("x-correlation-id") ?? requestId);

  return {
    requestId,
    correlationId,
    route,
    method: request.headers.get("x-method") ?? request.method,
    url: request.headers.get("x-url") ?? request.url,
    ipAddress: requestIp(request.headers),
    userAgent: request.headers.get("user-agent")?.slice(0, 2_000) ?? null,
    userId: session?.user.id ?? null,
    tenantId: session?.tenant.id ?? publicSite?.tenantId ?? null,
    siteId,
    sessionId,
    adminUserId: admin?.id ?? null,
    sourceArea: sourceAreaFor(route, admin?.id ?? null),
    environment: process.env.NODE_ENV ?? "unknown",
    releaseVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.npm_package_version ?? null,
    buildVersion: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null,
    templateCode: session ? site?.templateCode ?? null : publicSite?.templateCode ?? null,
  };
}
