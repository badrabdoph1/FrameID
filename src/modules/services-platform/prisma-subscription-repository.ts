import { ServiceSubscriptionStatus, type PrismaClient } from "@prisma/client";

import type { ServiceSubscriptionRepository } from "./subscription-service";

export function createPrismaServiceSubscriptionRepository(prisma: PrismaClient): ServiceSubscriptionRepository {
  return {
    getById(id) {
      return prisma.serviceSubscription.findUnique({
        where: { id },
        select: { id: true, tenantId: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, gracePeriodEndsAt: true, cancelAtPeriodEnd: true },
      });
    },
    async create(input) {
      return prisma.$transaction(async (tx) => {
        const subscription = await tx.serviceSubscription.upsert({
          where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
          update: {},
          create: {
            tenantId: input.tenantId,
            offeringId: input.offeringId,
            acquisitionId: input.acquisitionId,
            trialGrantId: input.trialGrantId,
            status: input.status,
            currentPeriodStart: input.currentPeriodStart,
            currentPeriodEnd: input.currentPeriodEnd,
            idempotencyKey: input.idempotencyKey,
          },
          select: { id: true, status: true },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `${input.idempotencyKey}:created` },
          update: {},
          create: {
            aggregateType: "ServiceSubscription",
            aggregateId: subscription.id,
            eventName: "services.subscription.created",
            payload: { subscriptionId: subscription.id, tenantId: input.tenantId, offeringId: input.offeringId, acquisitionId: input.acquisitionId },
            deduplicationKey: `${input.idempotencyKey}:created`,
          },
        });
        return subscription;
      });
    },
    async update(input) {
      return prisma.$transaction(async (tx) => {
        const current = await tx.serviceSubscription.findUniqueOrThrow({ where: { id: input.id } });
        const subscription = await tx.serviceSubscription.update({
          where: { id: input.id },
          data: {
            status: input.status as ServiceSubscriptionStatus,
            currentPeriodStart: input.currentPeriodStart,
            currentPeriodEnd: input.currentPeriodEnd,
            gracePeriodEndsAt: input.gracePeriodEndsAt,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd,
            cancelledAt: input.cancelledAt,
            cancellationReason: input.cancellationReason,
          },
          select: { id: true, status: true },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey },
          update: {},
          create: {
            aggregateType: "ServiceSubscription",
            aggregateId: current.id,
            eventName: `services.subscription.${input.status.toLowerCase()}`,
            payload: { subscriptionId: current.id, tenantId: current.tenantId, fromStatus: current.status, toStatus: input.status },
            deduplicationKey: input.idempotencyKey,
          },
        });
        return subscription;
      });
    },
  };
}
