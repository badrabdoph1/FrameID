import { TrialGrantStatus, type PrismaClient } from "@prisma/client";

import type { TrialRepository } from "./trial-service";

export function createPrismaTrialRepository(prisma: PrismaClient): TrialRepository {
  return {
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
      const grant = await prisma.trialGrant.upsert({
        where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
        update: {},
        create: {
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
        select: { id: true, status: true, startsAt: true, endsAt: true, graceEndsAt: true, usageLimit: true },
      });
      return { ...grant, status: "ACTIVE" as const };
    },
  };
}
