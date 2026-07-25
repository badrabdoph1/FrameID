import { AcquisitionStatus, PriceBillingInterval, Prisma, type PrismaClient } from "@prisma/client";

import type { AcquisitionRepository, AcquisitionRecord } from "./acquisition-service";
import { evaluateOfferingEligibility, type EligibilityPolicy } from "./eligibility";
import { buildPrismaEligibilityContext } from "./prisma-eligibility-context";
import { resolveCommerceMarket } from "./commerce-market";
import { parsePublishedCatalogSnapshot } from "./catalog-service";

function asRecord(acquisition: {
  id: string;
  tenantId: string;
  offeringId: string;
  status: AcquisitionStatus;
  correlationId: string;
  conversationId: string | null;
  metadata: Prisma.JsonValue | null;
  offering: { name: string };
}): AcquisitionRecord {
  const metadata = acquisition.metadata && typeof acquisition.metadata === "object" && !Array.isArray(acquisition.metadata)
    ? acquisition.metadata as Record<string, Prisma.JsonValue>
    : {};
  const catalogSnapshot = metadata.catalogSnapshot && typeof metadata.catalogSnapshot === "object" && !Array.isArray(metadata.catalogSnapshot)
    ? metadata.catalogSnapshot as Record<string, Prisma.JsonValue>
    : {};
  return {
    id: acquisition.id,
    tenantId: acquisition.tenantId,
    offeringId: acquisition.offeringId,
    offeringName: typeof catalogSnapshot.offeringName === "string" ? catalogSnapshot.offeringName : acquisition.offering.name,
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
      const offeringRef = await prisma.catalogOffering.findUnique({
        where: { id: input.offeringId },
        select: { productId: true, deletedAt: true },
      });
      if (!offeringRef?.productId || offeringRef.deletedAt) throw new Error(`Published offering not found: ${input.offeringId}`);
      const productRecord = await prisma.productDefinition.findFirst({
        where: { id: offeringRef.productId, publicationStatus: "PUBLISHED", deletedAt: null },
        select: {
          revisions: { where: { status: "PUBLISHED" }, orderBy: { revision: "desc" }, take: 1, select: { snapshot: true } },
        },
      });
      const product = parsePublishedCatalogSnapshot(productRecord?.revisions[0]?.snapshot);
      const offering = product?.offerings.find((candidate) => candidate.id === input.offeringId && !["PAUSED", "RETIRED"].includes(candidate.publicationStatus));
      if (!product || !offering) throw new Error(`Published offering snapshot not found: ${input.offeringId}`);
      if (!offering.workflowTemplateKey || !offering.workflowTemplateVersion) throw new Error(`Published offering has no workflow snapshot: ${offering.code}`);
      if (
        ["ANNOUNCED", "DEPRECATED"].includes(offering.releaseStage)
        || ["ANNOUNCED", "DEPRECATED"].includes(product.releaseStage)
      ) {
        throw new Error("Offering is not currently acquirable.");
      }
      const productEligibility = evaluateOfferingEligibility(context, product.eligibilityPolicy as EligibilityPolicy | null);
      const offeringEligibility = evaluateOfferingEligibility(context, offering.eligibilityPolicy as EligibilityPolicy | null);
      const tierAllowed = [product.accessTier, offering.accessTier].every((tier) => tier === "STANDARD" || context.accessTiers?.includes(tier));
      if (!productEligibility.visible || !productEligibility.eligible || !offeringEligibility.visible || !offeringEligibility.eligible || !tierAllowed) {
        throw new Error("Offering is not eligible for this tenant.");
      }
      const price = offering.prices
        .filter((candidate) => candidate.isActive && candidate.currency === currency && [marketCode, "GLOBAL"].includes(candidate.marketCode) && new Date(candidate.effectiveFrom) <= now && (!candidate.effectiveTo || new Date(candidate.effectiveTo) > now))
        .sort((left, right) => Number(right.marketCode === marketCode) - Number(left.marketCode === marketCode) || new Date(right.effectiveFrom).getTime() - new Date(left.effectiveFrom).getTime())[0] ?? null;
      if (!price && offering.type !== "CUSTOM_QUOTE") throw new Error(`Offering has no active price: ${offering.code}`);
      const correlationId = `services:${crypto.randomUUID()}`;
      const snapshot = {
        schemaVersion: 2,
        offeringCode: offering.code,
        offeringName: offering.name,
        productId: product.id,
        productCode: product.code,
        workflow: { key: offering.workflowTemplateKey, version: offering.workflowTemplateVersion },
        offeringType: offering.type,
        salesMode: offering.salesMode,
        fulfillmentMode: offering.fulfillmentMode,
        activationMode: offering.activationMode,
        requirements: offering.requirements,
        capabilities: offering.capabilities,
        price: price ? {
          id: price.id,
          amount: price.amount,
          currency: price.currency,
          billingInterval: price.billingInterval,
          marketCode: price.marketCode,
        } : null,
        bundleComponents: offering.bundleComponents.map((component) => ({
          offeringId: component.offeringId,
          offeringCode: component.offeringCode,
          offeringName: component.offeringName,
          productId: component.productId,
          productCode: component.productCode,
          quantity: component.quantity,
          required: component.required,
          capabilities: component.capabilities,
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
          offeringId: component.offeringId,
          priceId: null,
          snapshotCode: component.offeringCode,
          snapshotName: component.offeringName,
          unitAmount: 0,
          quantity: component.quantity,
          currency: price?.currency ?? currency,
          billingInterval: price?.billingInterval ?? PriceBillingInterval.ONE_TIME,
          snapshot: {
            bundledByOfferingId: offering.id,
            required: component.required,
            productCode: component.productCode,
            productId: component.productId,
            capabilities: component.capabilities,
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
              requestedByUserId: input.userId,
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
        const conversation = await tx.communicationConversation.findUnique({
          where: { id: input.conversationId },
          select: { tenantId: true },
        });
        if (!conversation || conversation.tenantId !== current.tenantId) {
          throw new Error("Acquisition conversation must belong to the same tenant.");
        }
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
