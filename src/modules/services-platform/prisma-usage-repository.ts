import { Prisma, type PrismaClient } from "@prisma/client";

import type { EntitlementAggregationPolicy } from "./entitlement-resolver";
import { UsageLimitExceededError, type UsageRepository } from "./usage-service";

function numericLimit(entitlements: Array<{ value: Prisma.JsonValue; quantity: number | null; capability: { aggregationPolicy: string } | null }>) {
  if (!entitlements.length) return null;
  const values = entitlements.map((item) => item.quantity ?? (typeof item.value === "number" ? item.value : null)).filter((value): value is number => value != null);
  if (!values.length) return null;
  const policy = (entitlements[0].capability?.aggregationPolicy ?? "REPLACE") as EntitlementAggregationPolicy;
  if (policy === "SUM") return values.reduce((sum, value) => sum + value, 0);
  if (policy === "MAX") return Math.max(...values);
  return values.at(-1) ?? null;
}

export function createPrismaUsageRepository(prisma: PrismaClient): UsageRepository {
  return {
    consume(input) {
      return prisma.$transaction(async (tx) => {
        const duplicate = await tx.usageLedger.findUnique({
          where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
        });
        const entitlements = await tx.entitlement.findMany({
          where: {
            tenantId: input.tenantId,
            capabilityKey: input.capabilityKey,
            status: "ACTIVE",
            startsAt: { lte: new Date() },
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          include: { capability: { select: { aggregationPolicy: true } } },
          orderBy: { startsAt: "asc" },
        });
        if (!entitlements.length) throw new Error(`No active entitlement for ${input.capabilityKey}.`);
        const acquisitionSourceIds = entitlements.filter((item) => item.sourceType === "ACQUISITION").map((item) => item.sourceId);
        const trialSourceIds = entitlements.filter((item) => item.sourceType === "TRIAL_GRANT").map((item) => item.sourceId);
        const [subscriptionPeriod, trialPeriod] = await Promise.all([
          acquisitionSourceIds.length ? tx.serviceSubscription.findFirst({
            where: { tenantId: input.tenantId, acquisitionId: { in: acquisitionSourceIds }, status: { in: ["TRIALING", "ACTIVE", "GRACE_PERIOD"] } },
            orderBy: { currentPeriodStart: "desc" },
            select: { id: true, currentPeriodStart: true },
          }) : null,
          trialSourceIds.length ? tx.trialGrant.findFirst({
            where: { tenantId: input.tenantId, id: { in: trialSourceIds }, status: "ACTIVE" },
            orderBy: { startsAt: "desc" },
            select: { id: true },
          }) : null,
        ]);
        const periodKey = subscriptionPeriod
          ? `subscription:${subscriptionPeriod.id}:${subscriptionPeriod.currentPeriodStart.toISOString()}`
          : trialPeriod ? `trial:${trialPeriod.id}` : "lifetime";
        const consumedAggregate = await tx.usageLedger.aggregate({
          where: { tenantId: input.tenantId, capabilityKey: input.capabilityKey, periodKey },
          _sum: { delta: true },
        });
        const consumed = consumedAggregate._sum.delta ?? 0;
        const limit = numericLimit(entitlements);
        if (duplicate) return { consumed, limit, duplicate: true };
        const attempted = consumed + input.amount;
        if (limit != null && attempted > limit) throw new UsageLimitExceededError(input.capabilityKey, limit, attempted);
        await tx.usageLedger.create({
          data: {
            tenantId: input.tenantId,
            entitlementId: entitlements[0].id,
            capabilityKey: input.capabilityKey,
            periodKey,
            delta: input.amount,
            idempotencyKey: input.idempotencyKey,
            metadata: input.metadata == null ? undefined : input.metadata as Prisma.InputJsonValue,
          },
        });
        return { consumed: attempted, limit, duplicate: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}
