import { AcquisitionStatus, PriceBillingInterval, Prisma, type PrismaClient } from "@prisma/client";

import type { AcquisitionRepository, AcquisitionRecord } from "./acquisition-service";

function asRecord(acquisition: {
  id: string;
  tenantId: string;
  offeringId: string;
  status: AcquisitionStatus;
  correlationId: string;
  conversationId: string | null;
  offering: { name: string };
}): AcquisitionRecord {
  return {
    id: acquisition.id,
    tenantId: acquisition.tenantId,
    offeringId: acquisition.offeringId,
    offeringName: acquisition.offering.name,
    status: acquisition.status,
    correlationId: acquisition.correlationId,
    conversationId: acquisition.conversationId,
    workItemRequired: true,
  };
}

export function createPrismaAcquisitionRepository(prisma: PrismaClient): AcquisitionRepository {
  return {
    async createFromCatalog(input) {
      const existing = await prisma.acquisition.findUnique({
        where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
        include: { offering: { select: { name: true } } },
      });
      if (existing) return asRecord(existing);

      const offering = await prisma.catalogOffering.findFirst({
        where: { id: input.offeringId, publicationStatus: "PUBLISHED", deletedAt: null },
        include: {
          product: { select: { code: true } },
          prices: {
            where: { isActive: true, effectiveFrom: { lte: new Date() }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }] },
            orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }],
            take: 1,
          },
        },
      });
      if (!offering) throw new Error(`Published offering not found: ${input.offeringId}`);
      const price = offering.prices[0] ?? null;
      if (!price && offering.type !== "CUSTOM_QUOTE") throw new Error(`Offering has no active price: ${offering.code}`);
      const correlationId = `services:${crypto.randomUUID()}`;
      const snapshot = {
        offeringCode: offering.code,
        offeringName: offering.name,
        productCode: offering.product?.code ?? null,
        offeringType: offering.type,
        salesMode: offering.salesMode,
        fulfillmentMode: offering.fulfillmentMode,
        activationMode: offering.activationMode,
        requirements: offering.requirements,
        price: price ? {
          id: price.id,
          version: price.version,
          amount: price.amount,
          currency: price.currency,
          billingInterval: price.billingInterval,
          marketCode: price.marketCode,
        } : null,
      };

      const created = await prisma.$transaction(async (tx) => {
        const acquisition = await tx.acquisition.create({
          data: {
            tenantId: input.tenantId,
            offeringId: offering.id,
            idempotencyKey: input.idempotencyKey,
            correlationId,
            attributionId: input.attributionId,
            acceptedCurrency: price?.currency ?? null,
            acceptedTotal: price?.amount ?? null,
            metadata: {
              customerMessage: input.customerMessage ?? null,
              catalogSnapshot: snapshot,
            } as Prisma.InputJsonValue,
            lines: {
              create: {
                offeringId: offering.id,
                priceId: price?.id,
                snapshotCode: offering.code,
                snapshotName: offering.name,
                unitAmount: price?.amount ?? 0,
                quantity: 1,
                currency: price?.currency ?? "EGP",
                billingInterval: price?.billingInterval ?? PriceBillingInterval.ONE_TIME,
                snapshot: snapshot as Prisma.InputJsonValue,
              },
            },
          },
          include: { offering: { select: { name: true } } },
        });
        await tx.servicesOutboxEvent.create({
          data: {
            aggregateType: "Acquisition",
            aggregateId: acquisition.id,
            eventName: "services.acquisition.created",
            payload: { acquisitionId: acquisition.id, tenantId: input.tenantId, offeringId: offering.id },
            deduplicationKey: `acquisition:${acquisition.id}:created`,
            correlationId,
          },
        });
        return acquisition;
      });
      return asRecord(created);
    },
    async attachConversation(input) {
      return prisma.$transaction(async (tx) => {
        const current = await tx.acquisition.findUniqueOrThrow({ where: { id: input.acquisitionId } });
        if (current.conversationId && current.conversationId !== input.conversationId) {
          throw new Error("Acquisition is already attached to another conversation.");
        }
        const acquisition = current.conversationId
          ? current
          : await tx.acquisition.update({
              where: { id: input.acquisitionId },
              data: { conversationId: input.conversationId, status: AcquisitionStatus.REQUESTED, requestedAt: input.requestedAt },
            });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `acquisition:${input.acquisitionId}:requested` },
          update: {},
          create: {
            aggregateType: "Acquisition",
            aggregateId: input.acquisitionId,
            eventName: "services.acquisition.requested",
            payload: { acquisitionId: input.acquisitionId, conversationId: input.conversationId },
            deduplicationKey: `acquisition:${input.acquisitionId}:requested`,
            correlationId: acquisition.correlationId,
          },
        });
        return { id: acquisition.id, status: acquisition.status, conversationId: input.conversationId };
      });
    },
    getState(acquisitionId) {
      return prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { status: true } });
    },
    async transition(input) {
      const timestamps = input.toStatus === "ACCEPTED" ? { acceptedAt: input.occurredAt }
        : input.toStatus === "PAID" ? { paidAt: input.occurredAt }
        : input.toStatus === "FULFILLED" ? { fulfilledAt: input.occurredAt }
        : input.toStatus === "CANCELLED" ? { cancelledAt: input.occurredAt, cancellationReason: input.reason }
        : input.toStatus === "DECLINED" ? { declineReasonCode: input.reason }
        : {};
      await prisma.$transaction(async (tx) => {
        const updated = await tx.acquisition.updateMany({
          where: { id: input.acquisitionId, status: input.fromStatus as AcquisitionStatus },
          data: { status: input.toStatus as AcquisitionStatus, ...timestamps },
        });
        if (updated.count !== 1) throw new Error("Acquisition state changed concurrently.");
        await tx.servicesOutboxEvent.create({
          data: {
            aggregateType: "Acquisition",
            aggregateId: input.acquisitionId,
            eventName: `services.acquisition.${input.toStatus.toLowerCase()}`,
            payload: { acquisitionId: input.acquisitionId, fromStatus: input.fromStatus, toStatus: input.toStatus, reason: input.reason ?? null },
            deduplicationKey: `acquisition:${input.acquisitionId}:${input.toStatus}:${input.occurredAt.toISOString()}`,
          },
        });
      });
    },
  };
}
