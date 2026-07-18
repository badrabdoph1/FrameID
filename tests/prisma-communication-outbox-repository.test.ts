import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { createPrismaCommunicationOutboxRepository } from "@/modules/communication-delivery/prisma-outbox-repository";

const NOW = new Date("2026-07-18T12:00:00.000Z");

describe("prisma communication outbox repository", () => {
  it("claims only available unlocked events with a lease owner", async () => {
    const calls: Array<{ name: string; args: unknown }> = [];
    const tx = {
      communicationOutboxEvent: {
        findMany: async (args: unknown) => { calls.push({ name: "find", args }); return [{ id: "event-1" }]; },
        updateMany: async (args: unknown) => { calls.push({ name: "claim", args }); return { count: 1 }; },
      },
    };
    const prisma = {
      $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx),
      communicationOutboxEvent: {
        findMany: async (args: unknown) => { calls.push({ name: "load", args }); return [{ id: "event-1", eventName: "communication.entry.appended.v1", eventVersion: 1, aggregateType: "CommunicationConversation", aggregateId: "conversation-1", payload: { conversationId: "conversation-1" }, attempts: 1 }]; },
      },
    };
    const repository = createPrismaCommunicationOutboxRepository(prisma as unknown as PrismaClient, { now: () => NOW });

    const result = await repository.claim({ workerId: "worker-1", limit: 10, leaseMs: 60_000 });

    expect(result).toHaveLength(1);
    expect(calls.find((call) => call.name === "find")?.args).toMatchObject({ where: { availableAt: { lte: NOW } }, take: 10 });
    expect(calls.find((call) => call.name === "claim")?.args).toMatchObject({
      where: { id: { in: ["event-1"] } },
      data: { status: "PROCESSING", leaseOwner: "worker-1", attempts: { increment: 1 } },
    });
  });

  it("resolves lightweight in-app targets from the conversation audience", async () => {
    const prisma = {
      communicationAudience: {
        findMany: async () => [{ tenantId: "tenant-1" }, { tenantId: "tenant-2" }],
      },
    };
    const repository = createPrismaCommunicationOutboxRepository(prisma as unknown as PrismaClient, { now: () => NOW });

    const targets = await repository.resolveDeliveries({
      id: "event-1",
      eventName: "communication.campaign.published.v1",
      eventVersion: 1,
      aggregateType: "CommunicationCampaign",
      aggregateId: "campaign-1",
      payload: { conversationId: "conversation-1" },
      attempts: 1,
    });

    expect(targets).toEqual([
      { tenantId: "tenant-1", channelKey: "IN_APP", recipientKey: "tenant:tenant-1" },
      { tenantId: "tenant-2", channelKey: "IN_APP", recipientKey: "tenant:tenant-2" },
    ]);
  });
});
