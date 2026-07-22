import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import { createServicesOutboxWorker, type ServicesEventHandler } from "./outbox-worker";
import { createPrismaServicesOutboxRepository } from "./prisma-outbox-repository";
import { createServicesPlatformRuntime } from "./runtime";

function stringPayload(payload: Record<string, unknown>, key: string) {
  return typeof payload[key] === "string" ? payload[key] as string : null;
}

export function createDefaultServicesEventHandlers(prisma: PrismaClient): ServicesEventHandler[] {
  return [
    {
      eventName: "services.payment.approved",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        if (!acquisitionId) return;
        const acquisition = await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { status: true } });
        if (acquisition && ["PAID", "ACCEPTED"].includes(acquisition.status)) {
          await createServicesPlatformRuntime(prisma).fulfillment.start({ acquisitionId, idempotencyKey: `outbox:fulfillment:${acquisitionId}` });
        }
      },
    },
    {
      eventName: "services.fulfillment.requested",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        if (!acquisitionId) return;
        const acquisition = await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { status: true } });
        if (acquisition && ["PAID", "ACCEPTED"].includes(acquisition.status)) {
          await createServicesPlatformRuntime(prisma).fulfillment.start({ acquisitionId, idempotencyKey: `outbox:fulfillment:${acquisitionId}` });
        }
      },
    },
    {
      eventName: "services.payment.refunded",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        const tenantId = stringPayload(event.payload, "tenantId")
          ?? (acquisitionId ? (await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { tenantId: true } }))?.tenantId : null);
        if (!acquisitionId || !tenantId) return;
        await createServicesPlatformRuntime(prisma).entitlements.revokeSource({ tenantId, sourceType: "ACQUISITION", sourceId: acquisitionId, reason: "PAYMENT_REFUNDED" });
        await prisma.$transaction([
          prisma.productInstance.updateMany({ where: { tenantId, acquisitionId, status: { in: ["PROVISIONING", "ACTIVE"] } }, data: { status: "SUSPENDED", suspendedAt: new Date() } }),
          prisma.serviceSubscription.updateMany({ where: { tenantId, acquisitionId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "SUSPENDED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "PAYMENT_REFUNDED" } }),
        ]);
      },
    },
    {
      eventName: "*",
      async handle(event) {
        const tenantId = stringPayload(event.payload, "tenantId");
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        await prisma.productAnalyticsEvent.upsert({
          where: { idempotencyKey: `outbox-analytics:${event.id}` },
          update: {},
          create: { tenantId, acquisitionId, name: event.eventName, version: event.eventVersion, idempotencyKey: `outbox-analytics:${event.id}`, properties: { aggregateType: event.aggregateType, aggregateId: event.aggregateId } },
        });
      },
    },
  ];
}

export function runServicesOutboxBatch(prisma: PrismaClient, workerId = `services-${randomUUID()}`) {
  return createServicesOutboxWorker(createPrismaServicesOutboxRepository(prisma), createDefaultServicesEventHandlers(prisma), { workerId }).runOnce();
}
