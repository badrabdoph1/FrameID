import type { Prisma, PrismaClient } from "@prisma/client";

import type { ClaimedServicesEvent, ServicesOutboxRepository } from "./outbox-worker";

function record(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function createPrismaServicesOutboxRepository(prisma: PrismaClient, now: () => Date = () => new Date()): ServicesOutboxRepository {
  return {
    async claim(input) {
      const ids = await prisma.$transaction(async (tx) => {
        const at = now();
        const candidates = await tx.servicesOutboxEvent.findMany({
          where: { availableAt: { lte: at }, OR: [{ status: "PENDING" }, { status: "PROCESSING", leaseExpiresAt: { lt: at } }] },
          orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
          take: input.limit,
          select: { id: true },
        });
        const candidateIds = candidates.map((item) => item.id);
        if (!candidateIds.length) return [];
        await tx.servicesOutboxEvent.updateMany({
          where: { id: { in: candidateIds }, OR: [{ status: "PENDING" }, { status: "PROCESSING", leaseExpiresAt: { lt: at } }] },
          data: { status: "PROCESSING", leaseOwner: input.workerId, leaseExpiresAt: new Date(at.getTime() + input.leaseMs), attempts: { increment: 1 } },
        });
        return candidateIds;
      });
      if (!ids.length) return [];
      const events = await prisma.servicesOutboxEvent.findMany({ where: { id: { in: ids }, status: "PROCESSING", leaseOwner: input.workerId }, orderBy: { createdAt: "asc" } });
      return events.map((event): ClaimedServicesEvent => ({
        id: event.id,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventName: event.eventName,
        eventVersion: event.eventVersion,
        payload: record(event.payload),
        attempts: event.attempts,
        correlationId: event.correlationId,
      }));
    },
    async markProcessed(eventId, leaseOwner) {
      await prisma.servicesOutboxEvent.updateMany({ where: { id: eventId, status: "PROCESSING", leaseOwner }, data: { status: "PROCESSED", processedAt: now(), leaseOwner: null, leaseExpiresAt: null, lastError: null } });
    },
    async reschedule(eventId, leaseOwner, input) {
      await prisma.servicesOutboxEvent.updateMany({ where: { id: eventId, status: "PROCESSING", leaseOwner }, data: { status: input.deadLetter ? "DEAD_LETTER" : "PENDING", availableAt: input.retryAt, leaseOwner: null, leaseExpiresAt: null, lastError: input.error } });
    },
  };
}
