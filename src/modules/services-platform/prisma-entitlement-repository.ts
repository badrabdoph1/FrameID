import { EntitlementStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { EntitlementRepository } from "./entitlement-service";
import type { EntitlementAggregationPolicy } from "./entitlement-resolver";

export function createPrismaEntitlementRepository(prisma: PrismaClient): EntitlementRepository {
  return {
    async upsertGrant(input) {
      const startsAt = input.startsAt ?? new Date();
      return prisma.$transaction(async (tx) => {
        const entitlement = await tx.entitlement.upsert({
          where: {
            tenantId_capabilityKey_sourceType_sourceId: {
              tenantId: input.tenantId,
              capabilityKey: input.capabilityKey,
              sourceType: input.sourceType,
              sourceId: input.sourceId,
            },
          },
          update: { productId: input.productId, offeringId: input.offeringId, capabilityId: input.capabilityId, status: EntitlementStatus.ACTIVE, value: input.value as Prisma.InputJsonValue, quantity: input.quantity, startsAt, endsAt: input.endsAt, suspendedAt: null, revokedAt: null, revocationReason: null },
          create: { tenantId: input.tenantId, productId: input.productId, offeringId: input.offeringId, capabilityId: input.capabilityId, capabilityKey: input.capabilityKey, sourceType: input.sourceType, sourceId: input.sourceId, value: input.value as Prisma.InputJsonValue, quantity: input.quantity, startsAt, endsAt: input.endsAt },
          select: { id: true },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `entitlement:${input.tenantId}:${input.capabilityKey}:${input.sourceType}:${input.sourceId}:granted` }, update: {},
          create: { aggregateType: "Entitlement", aggregateId: entitlement.id, eventName: "services.entitlement.granted", payload: { entitlementId: entitlement.id, tenantId: input.tenantId, capabilityKey: input.capabilityKey, sourceType: input.sourceType, sourceId: input.sourceId }, deduplicationKey: `entitlement:${input.tenantId}:${input.capabilityKey}:${input.sourceType}:${input.sourceId}:granted` },
        });
        return entitlement;
      });
    },
    async revokeSource(input) {
      return prisma.$transaction(async (tx) => {
        const result = await tx.entitlement.updateMany({
          where: { tenantId: input.tenantId, sourceType: input.sourceType, sourceId: input.sourceId, status: { in: [EntitlementStatus.ACTIVE, EntitlementStatus.SUSPENDED] } },
          data: { status: EntitlementStatus.REVOKED, revokedAt: input.revokedAt, revocationReason: input.reason },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `entitlement:${input.tenantId}:${input.sourceType}:${input.sourceId}:revoked:${input.reason}` }, update: {},
          create: { aggregateType: "EntitlementSource", aggregateId: input.sourceId, eventName: "services.entitlement.revoked", payload: { tenantId: input.tenantId, sourceType: input.sourceType, sourceId: input.sourceId, reason: input.reason, count: result.count }, deduplicationKey: `entitlement:${input.tenantId}:${input.sourceType}:${input.sourceId}:revoked:${input.reason}` },
        });
        return result.count;
      });
    },
    async listActive(tenantId, at) {
      const entitlements = await prisma.entitlement.findMany({
        where: {
          tenantId,
          status: EntitlementStatus.ACTIVE,
          startsAt: { lte: at },
          OR: [{ endsAt: null }, { endsAt: { gt: at } }],
        },
        include: { capability: { select: { aggregationPolicy: true } } },
        orderBy: [{ capabilityKey: "asc" }, { startsAt: "asc" }],
      });
      return entitlements.map((entitlement) => ({
        id: entitlement.id,
        capabilityKey: entitlement.capabilityKey,
        status: entitlement.status,
        value: entitlement.value,
        aggregationPolicy: (entitlement.capability?.aggregationPolicy ?? "REPLACE") as EntitlementAggregationPolicy,
        startsAt: entitlement.startsAt,
        endsAt: entitlement.endsAt,
      }));
    },
  };
}
