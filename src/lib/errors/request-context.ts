import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

function generateId(): string {
  return randomUUID().slice(0, 8);
}

export async function createRequestContext(): Promise<{
  requestId: string;
  correlationId: string;
  route?: string;
  method?: string;
  userAgent?: string;
}> {
  const requestId = generateId();
  const correlationId = generateId();

  try {
    const h = await headers();
    return {
      requestId,
      correlationId,
      route: h.get("x-invoke-path") ?? h.get("x-url") ?? undefined,
      method: h.get("x-invoke-method") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
    };
  } catch {
    return { requestId, correlationId };
  }
}

export function getPlatform(): string {
  return typeof navigator !== "undefined" ? navigator.platform : "server";
}

export function getBrowser(): string {
  if (typeof navigator === "undefined") return "server";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
}
