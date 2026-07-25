import { TrialGrantStatus, type PrismaClient } from "@prisma/client";

import type { TrialRepository } from "./trial-service";
import { evaluateOfferingEligibility, type EligibilityPolicy } from "./eligibility";
import { buildPrismaEligibilityContext } from "./prisma-eligibility-context";

export function createPrismaTrialRepository(prisma: PrismaClient): TrialRepository {
  return {
    async assertEligible(tenantId, policyId) {
      const policy = await prisma.trialPolicy.findUnique({
        where: { id: policyId },
        include: { offering: { include: { product: true } } },
      });
      if (!policy?.isActive || !policy.offering || policy.offering.publicationStatus !== "PUBLISHED" || policy.offering.product && policy.offering.product.publicationStatus !== "PUBLISHED") throw new Error("Trial offering is not published.");
      if (["ANNOUNCED", "DEPRECATED"].includes(policy.offering.releaseStage) || policy.offering.product && ["ANNOUNCED", "DEPRECATED"].includes(policy.offering.product.releaseStage)) throw new Error("Trial offering is not currently available.");
      if (policy.requiresPaymentMethod) throw new Error("This trial requires a supported saved payment method.");
      const context = await buildPrismaEligibilityContext(prisma, tenantId);
      const productResult = evaluateOfferingEligibility(context, policy.offering.product?.eligibilityPolicy as EligibilityPolicy | null);
      const offeringResult = evaluateOfferingEligibility(context, policy.offering.eligibilityPolicy as EligibilityPolicy | null);
      const policyResult = evaluateOfferingEligibility(context, policy.eligibilityPolicy as EligibilityPolicy | null);
      const tiers = [policy.offering.product?.accessTier, policy.offering.accessTier].filter((item): item is string => Boolean(item));
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
      const policy = await prisma.trialPolicy.findUnique({
        where: { id: policyId },
        include: { offering: { include: { capabilities: { include: { capability: { select: { id: true, key: true } } } } } } },
      });
      if (!policy) return null;
      if (!policy.offeringId || !policy.offering) throw new Error("A customer trial policy must be scoped to an offering.");
      return {
        id: policy.id,
        productId: policy.productId,
        offeringId: policy.offeringId,
        durationDays: policy.durationDays,
        usageLimit: policy.usageLimit,
        usageCapabilityKey: policy.usageCapabilityKey,
        graceDays: policy.graceDays,
        oncePerTenant: policy.oncePerTenant,
        isActive: policy.isActive,
        capabilities: policy.offering.capabilities.map((item) => ({
          capabilityId: item.capability.id,
          capabilityKey: item.capability.key,
          value: item.value,
          quantity: policy.usageCapabilityKey === item.capability.key ? policy.usageLimit : null,
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
