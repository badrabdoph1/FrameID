import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { clientProductAnalyticsEventNames, trackProductAnalyticsEvent } from "@/modules/services-platform/prisma-analytics";

const allowed = new Set<string>(clientProductAnalyticsEventNames);

export async function POST(request: Request) {
  const session = await getCurrentRequestSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name : "";
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 200) : "";
  if (!allowed.has(name) || !idempotencyKey) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  const productId = typeof body.productId === "string" ? body.productId : null;
  const offeringId = typeof body.offeringId === "string" ? body.offeringId : null;
  const attributionId = typeof body.attributionId === "string" ? body.attributionId : null;
  const properties = body.properties && typeof body.properties === "object" && !Array.isArray(body.properties) ? body.properties as Record<string, unknown> : null;
  if (properties && JSON.stringify(properties).length > 10_000) return NextResponse.json({ error: "event_too_large" }, { status: 413 });
  const [productExists, offeringExists, attributionExists] = await Promise.all([
    productId ? prisma.productDefinition.count({ where: { id: productId, publicationStatus: "PUBLISHED", deletedAt: null } }) : 1,
    offeringId ? prisma.catalogOffering.count({ where: { id: offeringId, ...(productId ? { productId } : {}), publicationStatus: "PUBLISHED", deletedAt: null } }) : 1,
    attributionId ? prisma.recommendationDecision.count({ where: { attributionId, tenantId: session.tenant.id, ...(offeringId ? { offeringId } : {}) } }) : 1,
  ]);
  if (!productExists || !offeringExists || !attributionExists) return NextResponse.json({ error: "invalid_reference" }, { status: 400 });
  const event = await trackProductAnalyticsEvent(prisma, {
    name: name as typeof clientProductAnalyticsEventNames[number],
    idempotencyKey: `client:${session.user.id}:${idempotencyKey}`,
    tenantId: session.tenant.id,
    userId: session.user.id,
    productId,
    offeringId,
    attributionId,
    sessionKey: typeof body.sessionKey === "string" ? body.sessionKey.slice(0, 200) : null,
    properties,
  });
  if (name === "recommendation.clicked" && attributionId) {
    await prisma.recommendationDecision.updateMany({
      where: { attributionId, tenantId: session.tenant.id, dismissedAt: null },
      data: { status: "CLICKED", clickedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true, eventId: event.id });
}
