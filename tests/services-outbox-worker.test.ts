import { describe, expect, it } from "vitest";

import { createServicesOutboxWorker, type ClaimedServicesEvent, type ServicesOutboxRepository } from "@/modules/services-platform/outbox-worker";

const event: ClaimedServicesEvent = {
  id: "evt_1",
  aggregateType: "Acquisition",
  aggregateId: "acq_1",
  eventName: "services.payment.approved",
  eventVersion: 1,
  payload: { acquisitionId: "acq_1" },
  attempts: 1,
};

class MemoryRepository implements ServicesOutboxRepository {
  processed: string[] = [];
  failures: Array<{ id: string; deadLetter: boolean; error: string }> = [];
  async claim() { return [event]; }
  async markProcessed(id: string) { this.processed.push(id); }
  async reschedule(id: string, _owner: string, input: { error: string; retryAt: Date; deadLetter: boolean }) {
    this.failures.push({ id, deadLetter: input.deadLetter, error: input.error });
  }
}

describe("services outbox worker", () => {
  it("dispatches an event to matching and wildcard extension handlers", async () => {
    const repository = new MemoryRepository();
    const handled: string[] = [];
    const worker = createServicesOutboxWorker(repository, [
      { eventName: "services.payment.approved", async handle(item) { handled.push(`exact:${item.id}`); } },
      { eventName: "*", async handle(item) { handled.push(`all:${item.eventName}`); } },
    ], { workerId: "worker_1" });

    await expect(worker.runOnce()).resolves.toEqual({ claimed: 1, processed: 1, failed: 0 });
    expect(handled).toEqual(["exact:evt_1", "all:services.payment.approved"]);
    expect(repository.processed).toEqual(["evt_1"]);
  });

  it("retries sanitized failures and dead-letters at the attempt limit", async () => {
    const repository = new MemoryRepository();
    const worker = createServicesOutboxWorker(repository, [
      { eventName: "*", async handle() { throw new Error("failed\nprivate-detail"); } },
    ], { workerId: "worker_1", maxAttempts: 1 });

    await expect(worker.runOnce()).resolves.toMatchObject({ failed: 1, processed: 0 });
    expect(repository.failures).toEqual([{ id: "evt_1", deadLetter: true, error: "failed private-detail" }]);
  });
});
