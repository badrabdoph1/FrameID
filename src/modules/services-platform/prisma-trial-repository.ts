import { TrialGrantStatus, type PrismaClient } from "@prisma/client";

import type { TrialRepository } from "./trial-service";
import { evaluateOfferingEligibility, type EligibilityPolicy } from "./eligibility";
import { buildPrismaEligibilityContext } from "./prisma-eligibility-context";
import { parsePublishedCatalogSnapshot } from "./catalog-service";

async function loadPublishedPolicy(prisma: PrismaClient, policyId: string) {
  const locator = await prisma.trialPolicy.findUnique({
    where: { id: policyId },
    select: { productId: true, offering: { select: { productId: true } } },
  });
  const productId = locator?.productId ?? locator?.offering?.productId;
  if (!productId) return null;
  const productRecord = await prisma.productDefinition.findFirst({
    where: { id: productId, publicationStatus: "PUBLISHED", deletedAt: null },
    select: { revisions: { where: { status: "PUBLISHED" }, orderBy: { revision: "desc" }, take: 1, select: { snapshot: true } } },
  });
  const product = parsePublishedCatalogSnapshot(productRecord?.revisions[0]?.snapshot);
  if (!product) return null;
  for (const offering of product.offerings) {
    const policy = (offering.trialPolicies ?? []).find((candidate) => candidate.id === policyId);
    if (policy) return { product, offering, policy };
  }
  return null;
}

export function createPrismaTrialRepository(prisma: PrismaClient): TrialRepository {
  return {
    async assertEligible(tenantId, policyId) {
      const published = await loadPublishedPolicy(prisma, policyId);
      if (!published?.policy.isActive) throw new Error("Trial offering is not published.");
      const { product, offering, policy } = published;
      if (["ANNOUNCED", "DEPRECATED"].includes(offering.releaseStage) || ["ANNOUNCED", "DEPRECATED"].includes(product.releaseStage)) throw new Error("Trial offering is not currently available.");
      if (policy.requiresPaymentMethod) throw new Error("This trial requires a supported saved payment method.");
      const context = await buildPrismaEligibilityContext(prisma, tenantId);
      const productResult = evaluateOfferingEligibility(context, product.eligibilityPolicy as EligibilityPolicy | null);
      const offeringResult = evaluateOfferingEligibility(context, offering.eligibilityPolicy as EligibilityPolicy | null);
      const policyResult = evaluateOfferingEligibility(context, policy.eligibilityPolicy as EligibilityPolicy | null);
      const tiers = [product.accessTier, offering.accessTier];
      if (!productResult.visible || !productResult.eligible || !offeringResult.visible || !offeringResult.eligible || !policyResult.visible || !policyResult.eligible || tiers.some((tier) => tier !== "STANDARD" && !context.accessTiers?.includes(tier))) {
        throw new Error("Trial is not eligible for this tenant.");
      }
    },
    async getGrantByIdempotency(tenantId, idempotencyKey) {
      const grant = await prisma.trialGrant.findUnique({
        where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
        select: { id: true, status: true, startsAt: true, endsAt: true, graceEndsAt: true, usageLimit: true },
      });
      return grant?.status === "ACTIVE" ? { ...grant, status: "ACTIVE" as const } : null;
    },
    async getPolicy(policyId) {
      const published = await loadPublishedPolicy(prisma, policyId);
      if (!published) return null;
      const { product, offering, policy } = published;
      return {
        id: policy.id,
        productId: policy.productId ?? product.id,
        offeringId: offering.id,
        durationDays: policy.durationDays,
        usageLimit: policy.usageLimit,
        usageCapabilityKey: policy.usageCapabilityKey,
        graceDays: policy.graceDays,
        oncePerTenant: policy.oncePerTenant,
        isActive: policy.isActive,
        capabilities: offering.capabilities.map((item) => ({
          capabilityId: item.capabilityId,
          capabilityKey: item.capabilityKey,
          value: item.value,
          quantity: policy.usageCapabilityKey === item.capabilityKey ? policy.usageLimit : null,
        })),
      };
    },
    async hasPreviousGrant(tenantId, offeringId) {
      return await prisma.trialGrant.count({ where: { tenantId, offeringId } }) > 0;
    },
    async createGrant(input) {
      const grant = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.tenantId}), hashtext(${input.offeringId}))`;
        const existing = await tx.trialGrant.findUnique({
          where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
          select: { id: true, offeringId: true, status: true, startsAt: true, endsAt: true, graceEndsAt: true, usageLimit: true },
        });
        if (existing) {
          if (existing.offeringId !== input.offeringId || existing.status !== TrialGrantStatus.ACTIVE) throw new Error("Trial idempotency key is already bound to another or inactive grant.");
          return existing;
        }
        if (input.oncePerTenant && await tx.trialGrant.count({ where: { tenantId: input.tenantId, offeringId: input.offeringId } }) > 0) {
          throw new Error("This tenant has already used this trial.");
        }
        return tx.trialGrant.create({
          data: {
            tenantId: input.tenantId,
            productId: input.productId,
            offeringId: input.offeringId,
            idempotencyKey: input.idempotencyKey,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            graceEndsAt: input.graceEndsAt,
            usageLimit: input.usageLimit,
            status: TrialGrantStatus.ACTIVE,
          },
          select: { id: true, offeringId: true, status: true, startsAt: true, endsAt: true, graceEndsAt: true, usageLimit: true },
        });
      });
      return { ...grant, status: "ACTIVE" as const };
    },
  };
}
