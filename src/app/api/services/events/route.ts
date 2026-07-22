import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { productAnalyticsEventNames, trackProductAnalyticsEvent } from "@/modules/services-platform/prisma-analytics";

const allowed = new Set<string>(productAnalyticsEventNames);

export async function POST(request: Request) {
  const session = await getCurrentRequestSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name : "";
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 200) : "";
  if (!allowed.has(name) || !idempotencyKey) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  const event = await trackProductAnalyticsEvent(prisma, {
    name: name as typeof productAnalyticsEventNames[number],
    idempotencyKey: `client:${session.user.id}:${idempotencyKey}`,
    tenantId: session.tenant.id,
    userId: session.user.id,
    productId: typeof body.productId === "string" ? body.productId : null,
    offeringId: typeof body.offeringId === "string" ? body.offeringId : null,
    attributionId: typeof body.attributionId === "string" ? body.attributionId : null,
    sessionKey: typeof body.sessionKey === "string" ? body.sessionKey.slice(0, 200) : null,
    properties: body.properties && typeof body.properties === "object" && !Array.isArray(body.properties) ? body.properties as Record<string, unknown> : null,
  });
  return NextResponse.json({ ok: true, eventId: event.id });
}
