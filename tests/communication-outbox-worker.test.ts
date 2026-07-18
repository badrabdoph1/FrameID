import { describe, expect, it } from "vitest";

import {
  createCommunicationOutboxWorker,
  type CommunicationDeliveryAdapter,
  type CommunicationOutboxDeliveryRepository,
  type ClaimedCommunicationEvent,
} from "@/modules/communication-delivery/outbox-worker";

const event: ClaimedCommunicationEvent = {
  id: "event-1",
  eventName: "communication.entry.appended.v1",
  eventVersion: 1,
  aggregateType: "CommunicationConversation",
  aggregateId: "conversation-1",
  payload: { conversationId: "conversation-1", entryId: "entry-2" },
  attempts: 0,
};

class MemoryRepository implements CommunicationOutboxDeliveryRepository {
  claimed = false;
  processed: string[] = [];
  failed: Array<{ id: string; error: string; deadLetter: boolean }> = [];
  delivered: string[] = [];

  async claim() {
    if (this.claimed) return [];
    this.claimed = true;
    return [event];
  }

  async resolveDeliveries() {
    return [
      { tenantId: "tenant-1", channelKey: "IN_APP", recipientKey: "tenant:tenant-1" },
      { tenantId: "tenant-2", channelKey: "IN_APP", recipientKey: "tenant:tenant-2" },
    ];
  }

  async markDeliverySucceeded(_eventId: string, idempotencyKey: string) { this.delivered.push(idempotencyKey); }
  async markDeliveryFailed() {}
  async markEventProcessed(eventId: string, leaseOwner: string) { void leaseOwner; this.processed.push(eventId); }
  async rescheduleEvent(eventId: string, _leaseOwner: string, input: { error: string; deadLetter: boolean }) { this.failed.push({ id: eventId, ...input }); }
}

describe("communication outbox worker", () => {
  it("delivers every resolved target idempotently and marks the event processed", async () => {
    const repository = new MemoryRepository();
    const calls: string[] = [];
    const adapter: CommunicationDeliveryAdapter = {
      channelKey: "IN_APP",
      async deliver(input) { calls.push(input.recipientKey); return { providerMessageId: null }; },
    };
    const worker = createCommunicationOutboxWorker(repository, [adapter], { workerId: "worker-1" });

    const result = await worker.runOnce();

    expect(result).toEqual({ claimed: 1, processed: 1, failed: 0, deliveries: 2 });
    expect(calls).toEqual(["tenant:tenant-1", "tenant:tenant-2"]);
    expect(repository.delivered).toEqual([
      "event-1:IN_APP:tenant:tenant-1",
      "event-1:IN_APP:tenant:tenant-2",
    ]);
    expect(repository.processed).toEqual(["event-1"]);
  });

  it("reschedules a failed event with a sanitized error", async () => {
    const repository = new MemoryRepository();
    const adapter: CommunicationDeliveryAdapter = {
      channelKey: "IN_APP",
      async deliver() { throw new Error("provider failed\nsecret-token"); },
    };
    const worker = createCommunicationOutboxWorker(repository, [adapter], { workerId: "worker-1", maxAttempts: 3 });

    const result = await worker.runOnce();

    expect(result).toMatchObject({ claimed: 1, processed: 0, failed: 1 });
    expect(repository.failed[0]).toMatchObject({ id: "event-1", error: "provider failed secret-token", deadLetter: false });
    expect(repository.processed).toHaveLength(0);
  });

  it("dead-letters an event after the configured attempt limit", async () => {
    const repository = new MemoryRepository();
    event.attempts = 3;
    const worker = createCommunicationOutboxWorker(repository, [], { workerId: "worker-1", maxAttempts: 3 });

    await worker.runOnce();

    expect(repository.failed[0]?.deadLetter).toBe(true);
    event.attempts = 0;
  });

  it("does not dead-letter the event before the claimed attempt reaches the limit", async () => {
    const repository = new MemoryRepository();
    event.attempts = 2;
    const worker = createCommunicationOutboxWorker(repository, [], { workerId: "worker-1", maxAttempts: 3 });

    await worker.runOnce();

    expect(repository.failed[0]?.deadLetter).toBe(false);
    event.attempts = 0;
  });
});
