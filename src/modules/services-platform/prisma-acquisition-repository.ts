import { AcquisitionStatus, PriceBillingInterval, Prisma, type PrismaClient } from "@prisma/client";

import type { AcquisitionRepository, AcquisitionRecord } from "./acquisition-service";
import { evaluateOfferingEligibility, type EligibilityPolicy } from "./eligibility";
import { buildPrismaEligibilityContext } from "./prisma-eligibility-context";
import { resolveCommerceMarket } from "./commerce-market";

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

      const context = await buildPrismaEligibilityContext(prisma, input.tenantId);
      const { marketCode, currency } = resolveCommerceMarket(context);
      const now = new Date();
      const offering = await prisma.catalogOffering.findFirst({
        where: { id: input.offeringId, publicationStatus: "PUBLISHED", deletedAt: null },
        include: {
          product: { select: { code: true, accessTier: true, eligibilityPolicy: true, releaseStage: true, publicationStatus: true } },
          bundleComponents: {
            orderBy: { sortOrder: "asc" },
            include: { componentOffering: { include: { product: { select: { code: true, publicationStatus: true, releaseStage: true } }, capabilities: { include: { capability: { select: { key: true } } } } } } },
          },
          prices: {
            where: { isActive: true, currency, marketCode: { in: [marketCode, "GLOBAL"] }, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
            orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }],
          },
        },
      });
      if (!offering) throw new Error(`Published offering not found: ${input.offeringId}`);
      if (
        Boolean(offering.product?.publicationStatus && offering.product.publicationStatus !== "PUBLISHED")
        || ["ANNOUNCED", "DEPRECATED"].includes(offering.releaseStage)
        || Boolean(offering.product && ["ANNOUNCED", "DEPRECATED"].includes(offering.product.releaseStage))
      ) {
        throw new Error("Offering is not currently acquirable.");
      }
      const unavailableBundleComponent = offering.bundleComponents.find(({ componentOffering }) =>
        componentOffering.publicationStatus !== "PUBLISHED"
        || ["ANNOUNCED", "DEPRECATED"].includes(componentOffering.releaseStage)
        || Boolean(componentOffering.product && componentOffering.product.publicationStatus !== "PUBLISHED")
        || Boolean(componentOffering.product && ["ANNOUNCED", "DEPRECATED"].includes(componentOffering.product.releaseStage))
      );
      if (unavailableBundleComponent) throw new Error(`Bundle component is not currently available: ${unavailableBundleComponent.componentOffering.code}`);
      const productEligibility = evaluateOfferingEligibility(context, offering.product?.eligibilityPolicy as EligibilityPolicy | null);
      const offeringEligibility = evaluateOfferingEligibility(context, offering.eligibilityPolicy as EligibilityPolicy | null);
      const tierAllowed = [offering.product?.accessTier, offering.accessTier].filter(Boolean).every((tier) => tier === "STANDARD" || context.accessTiers?.includes(tier!));
      if (!productEligibility.visible || !productEligibility.eligible || !offeringEligibility.visible || !offeringEligibility.eligible || !tierAllowed) {
        throw new Error("Offering is not eligible for this tenant.");
      }
      const price = offering.prices.sort((left, right) => Number(right.marketCode === marketCode) - Number(left.marketCode === marketCode) || right.version - left.version)[0] ?? null;
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
        bundleComponents: offering.bundleComponents.map((component) => ({
          offeringId: component.componentOffering.id,
          offeringCode: component.componentOffering.code,
          offeringName: component.componentOffering.name,
          productCode: component.componentOffering.product?.code ?? null,
          quantity: component.quantity,
          required: component.required,
          capabilityKeys: component.componentOffering.capabilities.map((item) => item.capability.key),
        })),
      };
      const lines = [
        {
          offeringId: offering.id,
          priceId: price?.id,
          snapshotCode: offering.code,
          snapshotName: offering.name,
          unitAmount: price?.amount ?? 0,
          quantity: 1,
          currency: price?.currency ?? currency,
          billingInterval: price?.billingInterval ?? PriceBillingInterval.ONE_TIME,
          snapshot: snapshot as Prisma.InputJsonValue,
        },
        ...offering.bundleComponents.map((component) => ({
          offeringId: component.componentOffering.id,
          priceId: null,
          snapshotCode: component.componentOffering.code,
          snapshotName: component.componentOffering.name,
          unitAmount: 0,
          quantity: component.quantity,
          currency: price?.currency ?? currency,
          billingInterval: price?.billingInterval ?? PriceBillingInterval.ONE_TIME,
          snapshot: {
            bundledByOfferingId: offering.id,
            required: component.required,
            productCode: component.componentOffering.product?.code ?? null,
            capabilityKeys: component.componentOffering.capabilities.map((item) => item.capability.key),
          } as Prisma.InputJsonValue,
        })),
      ];

      const created = await prisma.$transaction(async (tx) => {
        const acquisition = await tx.acquisition.upsert({
          where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
          update: {},
          create: {
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
            lines: { create: lines },
          },
          include: { offering: { select: { name: true } } },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `acquisition:${acquisition.id}:created` },
          update: {},
          create: {
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
        await tx.$queryRaw`SELECT id FROM "Acquisition" WHERE id = ${input.acquisitionId} FOR UPDATE`;
        const current = await tx.acquisition.findUniqueOrThrow({ where: { id: input.acquisitionId } });
        if (current.conversationId && current.conversationId !== input.conversationId) {
          throw new Error("Acquisition is already attached to another conversation.");
        }
        if (!current.conversationId && current.status !== AcquisitionStatus.DRAFT) {
          throw new Error(`Acquisition cannot attach a conversation from status ${current.status}.`);
        }
        if (!current.conversationId) {
          const attached = await tx.acquisition.updateMany({
            where: { id: input.acquisitionId, status: AcquisitionStatus.DRAFT, conversationId: null },
            data: { conversationId: input.conversationId, status: AcquisitionStatus.REQUESTED, requestedAt: input.requestedAt },
          });
          if (attached.count !== 1) throw new Error("Acquisition conversation attachment changed concurrently.");
        }
        const acquisition = current.conversationId
          ? current
          : await tx.acquisition.findUniqueOrThrow({ where: { id: input.acquisitionId } });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `acquisition:${input.acquisitionId}:requested` },
          update: {},
          create: {
            aggregateType: "Acquisition",
            aggregateId: input.acquisitionId,
            eventName: "services.acquisition.requested",
            payload: { acquisitionId: input.acquisitionId, conversationId: input.conversationId, tenantId: acquisition.tenantId, offeringId: acquisition.offeringId, attributionId: acquisition.attributionId },
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
        const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: input.acquisitionId }, select: { tenantId: true, correlationId: true } });
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
            payload: { acquisitionId: input.acquisitionId, tenantId: acquisition.tenantId, fromStatus: input.fromStatus, toStatus: input.toStatus, reason: input.reason ?? null },
            deduplicationKey: `acquisition:${input.acquisitionId}:${input.toStatus}:${input.occurredAt.toISOString()}`,
            correlationId: acquisition.correlationId,
          },
        });
      });
    },
  };
}
