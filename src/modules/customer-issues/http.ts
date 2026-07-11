import type { RateLimitResult } from "@/lib/rate-limiter";
import type { CaptureOccurrenceInput } from "./customer-issue-service";
import type { TrustedIssueContext } from "./context";
import { sanitizeIssuePayload } from "./sanitize";

type CaptureResult = { id: string };
type ReportResult = { merged: boolean; issue: { id: string; number: number } };

type HttpDependencies = {
  resolveContext(request: Request): Promise<TrustedIssueContext>;
  captureOccurrence(input: CaptureOccurrenceInput): Promise<CaptureResult>;
  reportIssue(input: { occurrenceId: string; customerNote?: string | null }): Promise<ReportResult>;
  rateLimit(key: string): RateLimitResult;
};

function json(message: Record<string, unknown>, status: number) {
  return Response.json(message, { status, headers: { "cache-control": "no-store" } });
}

async function readObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
}

function level(value: unknown): CaptureOccurrenceInput["level"] {
  return value === "DEBUG" || value === "INFO" || value === "WARN" || value === "FATAL" ? value : "ERROR";
}

function rateKey(kind: string, context: TrustedIssueContext): string {
  return `${kind}:${context.ipAddress ?? context.sessionId ?? context.siteId ?? "anonymous"}`;
}

export function createCustomerIssueHttpHandlers(dependencies: HttpDependencies) {
  return {
    async capture(request: Request): Promise<Response> {
      const context = await dependencies.resolveContext(request);
      const limit = dependencies.rateLimit(rateKey("capture", context));
      if (!limit.allowed) return json({ message: "تم استلام محاولات كفاية دلوقتي. جرّب بعد شوية." }, 429);
      const body = await readObject(request);
      if (!body) return json({ message: "تعذر استلام البلاغ. جرّب تاني." }, 400);
      const message = text(body.message, 2_000);
      if (!message) return json({ message: "تعذر استلام البلاغ. جرّب تاني." }, 400);

      try {
        const occurrence = await dependencies.captureOccurrence({
          category: text(body.category, 80) ?? "CLIENT_ERROR",
          level: level(body.level),
          code: text(body.code, 120) ?? "FID-CLIENT-001",
          errorType: text(body.errorType, 160) ?? "Error",
          message,
          requestId: context.requestId,
          correlationId: context.correlationId,
          route: context.route,
          method: context.method,
          url: context.url,
          stack: text(body.stack, 12_000),
          digest: text(body.digest, 500),
          cause: text(body.cause, 2_000),
          userId: context.userId,
          tenantId: context.tenantId,
          siteId: context.siteId,
          sessionId: context.sessionId,
          adminUserId: context.adminUserId,
          sourceArea: context.sourceArea,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          browser: text(body.browser, 200),
          device: text(body.device, 200),
          os: text(body.os, 200),
          language: text(body.language, 80),
          timezone: text(body.timezone, 120),
          screenSize: text(body.screenSize, 80),
          referrer: text(body.referrer, 2_000),
          connectionStatus: text(body.connectionStatus, 80),
          environment: context.environment,
          releaseVersion: context.releaseVersion,
          buildVersion: context.buildVersion,
          templateCode: context.templateCode,
          lastAction: text(body.lastAction, 300),
          metadata: sanitizeIssuePayload(
            body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
              ? body.metadata as Record<string, unknown>
              : {},
          ),
        });
        return json({ occurrenceId: occurrence.id }, 201);
      } catch {
        return json({ message: "في تحديث دلوقتي، والبلاغ هيتسجل تلقائيًا مع المحاولة الجاية." }, 503);
      }
    },

    async report(request: Request): Promise<Response> {
      const context = await dependencies.resolveContext(request);
      const limit = dependencies.rateLimit(rateKey("report", context));
      if (!limit.allowed) return json({ message: "تم استلام البلاغ بالفعل. شكرًا لمساعدتك." }, 429);
      const body = await readObject(request);
      const occurrenceId = text(body?.occurrenceId, 160);
      if (!body || !occurrenceId) return json({ message: "تعذر ربط البلاغ. جرّب تاني." }, 400);
      const customerNote = body.customerNote === undefined || body.customerNote === null || body.customerNote === ""
        ? null
        : text(body.customerNote, 2_000);
      if (body.customerNote && !customerNote) return json({ message: "الملاحظة أطول من المسموح." }, 400);

      try {
        const result = await dependencies.reportIssue({ occurrenceId, customerNote });
        return json({
          issueId: result.issue.id,
          issueNumber: `ISS-${String(result.issue.number).padStart(6, "0")}`,
          merged: result.merged,
        }, 201);
      } catch {
        return json({ message: "تعذر إرسال البلاغ دلوقتي. جرّب تاني بعد لحظات." }, 503);
      }
    },
  };
}
