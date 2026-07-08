import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

function generateId(): string {
  return randomUUID().slice(0, 12);
}

export async function createRequestContext(): Promise<{
  requestId: string;
  correlationId: string;
  route?: string;
  method?: string;
  userAgent?: string;
}> {
  const fallbackRequestId = generateId();
  const fallbackCorrelationId = generateId();

  try {
    const h = await headers();
    const requestId =
      h.get("x-request-id") ??
      h.get("x-frameid-request-id") ??
      fallbackRequestId;
    const correlationId =
      h.get("x-correlation-id") ??
      h.get("x-frameid-correlation-id") ??
      requestId ??
      fallbackCorrelationId;

    return {
      requestId,
      correlationId,
      route:
        h.get("x-invoke-path") ??
        h.get("x-url") ??
        h.get("x-pathname") ??
        h.get("referer") ??
        undefined,
      method: h.get("x-invoke-method") ?? h.get("x-method") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
    };
  } catch {
    return { requestId: fallbackRequestId, correlationId: fallbackCorrelationId };
  }
}

export function getPlatform(): string {
  return typeof navigator !== "undefined" ? navigator.platform : "server";
}

export function getBrowser(): string {
  if (typeof navigator === "undefined") return "server";
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}
