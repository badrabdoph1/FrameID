import type { Prisma, PrismaClient } from "@prisma/client";

import type {
  ClaimedCommunicationEvent,
  CommunicationOutboxDeliveryRepository,
} from "./outbox-worker";

function jsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function deliveryIdentity(idempotencyKey: string) {
  const [eventId, channelKey, ...recipientParts] = idempotencyKey.split(":");
  const recipientKey = recipientParts.join(":");
  const tenantId = recipientKey.startsWith("tenant:") ? recipientKey.slice("tenant:".length) : null;
  return { eventId, channelKey, recipientKey, tenantId };
}

export function createPrismaCommunicationOutboxRepository(
  prisma: PrismaClient,
  options: { now?: () => Date } = {},
): CommunicationOutboxDeliveryRepository {
  const now = options.now ?? (() => new Date());
  return {
    async claim(input) {
      const claimedIds = await prisma.$transaction(async (transaction) => {
        const at = now();
        const candidates = await transaction.communicationOutboxEvent.findMany({
          where: {
            availableAt: { lte: at },
            OR: [
              { status: "PENDING" },
              { status: "PROCESSING", leaseExpiresAt: { lt: at } },
            ],
          },
          orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
          take: input.limit,
          select: { id: true },
        });
        const ids = candidates.map((candidate) => candidate.id);
        if (ids.length === 0) return [];
        await transaction.communicationOutboxEvent.updateMany({
          where: {
            id: { in: ids },
            OR: [
              { status: "PENDING" },
              { status: "PROCESSING", leaseExpiresAt: { lt: at } },
            ],
          },
          data: {
            status: "PROCESSING",
            leaseOwner: input.workerId,
            leaseExpiresAt: new Date(at.getTime() + input.leaseMs),
            attempts: { increment: 1 },
          },
        });
        return ids;
      });
      if (claimedIds.length === 0) return [];
      const events = await prisma.communicationOutboxEvent.findMany({
        where: { id: { in: claimedIds }, status: "PROCESSING", leaseOwner: input.workerId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          eventName: true,
          eventVersion: true,
          aggregateType: true,
          aggregateId: true,
          payload: true,
          attempts: true,
          leaseOwner: true,
        },
      });
      return events.map((event): ClaimedCommunicationEvent => ({
        ...event,
        leaseOwner: event.leaseOwner ?? undefined,
        payload: jsonRecord(event.payload),
      }));
    },

    async resolveDeliveries(event) {
      const conversationId = typeof event.payload.conversationId === "string"
        ? event.payload.conversationId
        : event.aggregateType === "CommunicationConversation" ? event.aggregateId : null;
      if (!conversationId) return [];
      const audiences = await prisma.communicationAudience.findMany({
        where: { conversationId, withdrawnAt: null },
        orderBy: { tenantId: "asc" },
        select: { tenantId: true },
      });
      return audiences.map((audience) => ({
        tenantId: audience.tenantId,
        channelKey: "IN_APP",
        recipientKey: `tenant:${audience.tenantId}`,
      }));
    },

    async markDeliverySucceeded(eventId, idempotencyKey, providerMessageId) {
      const identity = deliveryIdentity(idempotencyKey);
      await prisma.communicationDeliveryAttempt.upsert({
        where: { idempotencyKey },
        update: {
          status: "DELIVERED",
          attempts: { increment: 1 },
          providerMessageId,
          deliveredAt: now(),
          failedAt: null,
          lastErrorCode: null,
          lastError: null,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
        create: {
          outboxEventId: eventId,
          tenantId: identity.tenantId,
          channelKey: identity.channelKey,
          recipientKey: identity.recipientKey,
          idempotencyKey,
          status: "DELIVERED",
          attempts: 1,
          providerMessageId,
          deliveredAt: now(),
        },
      });
    },

    async markDeliveryFailed(eventId, idempotencyKey, input) {
      const identity = deliveryIdentity(idempotencyKey);
      await prisma.communicationDeliveryAttempt.upsert({
        where: { idempotencyKey },
        update: {
          status: "FAILED",
          attempts: { increment: 1 },
          availableAt: input.retryAt,
          failedAt: now(),
          lastErrorCode: "DELIVERY_FAILED",
          lastError: input.error,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
        create: {
          outboxEventId: eventId,
          tenantId: identity.tenantId,
          channelKey: identity.channelKey,
          recipientKey: identity.recipientKey,
          idempotencyKey,
          status: "FAILED",
          attempts: 1,
          availableAt: input.retryAt,
          failedAt: now(),
          lastErrorCode: "DELIVERY_FAILED",
          lastError: input.error,
        },
      });
    },

    async markEventProcessed(eventId, leaseOwner) {
      await prisma.communicationOutboxEvent.updateMany({
        where: { id: eventId, status: "PROCESSING", leaseOwner },
        data: { status: "PROCESSED", processedAt: now(), leaseOwner: null, leaseExpiresAt: null, lastError: null },
      });
    },

    async rescheduleEvent(eventId, leaseOwner, input) {
      await prisma.communicationOutboxEvent.updateMany({
        where: { id: eventId, status: "PROCESSING", leaseOwner },
        data: {
          status: input.deadLetter ? "DEAD_LETTER" : "PENDING",
          availableAt: input.retryAt,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError: input.error,
        },
      });
    },
  };
}
