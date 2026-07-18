export type ClaimedCommunicationEvent = {
  id: string;
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  attempts: number;
  leaseOwner?: string;
};

export type CommunicationDeliveryTarget = {
  tenantId: string | null;
  channelKey: string;
  recipientKey: string;
};

export type CommunicationDeliveryAdapter = {
  channelKey: string;
  deliver(input: {
    event: ClaimedCommunicationEvent;
    tenantId: string | null;
    recipientKey: string;
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string | null }>;
};

export interface CommunicationOutboxDeliveryRepository {
  claim(input: { workerId: string; limit: number; leaseMs: number }): Promise<ClaimedCommunicationEvent[]>;
  resolveDeliveries(event: ClaimedCommunicationEvent): Promise<CommunicationDeliveryTarget[]>;
  markDeliverySucceeded(eventId: string, idempotencyKey: string, providerMessageId: string | null): Promise<void>;
  markDeliveryFailed(eventId: string, idempotencyKey: string, input: { error: string; retryAt: Date }): Promise<void>;
  markEventProcessed(eventId: string, leaseOwner: string): Promise<void>;
  rescheduleEvent(eventId: string, leaseOwner: string, input: { error: string; retryAt: Date; deadLetter: boolean }): Promise<void>;
}

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : "فشل تسليم غير معروف";
  return message.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 500);
}

function retryDelayMs(attempt: number): number {
  return Math.min(15 * 60_000, 15_000 * (2 ** Math.max(0, attempt - 1)));
}

export function createCommunicationOutboxWorker(
  repository: CommunicationOutboxDeliveryRepository,
  adapters: CommunicationDeliveryAdapter[],
  options: { workerId: string; batchSize?: number; leaseMs?: number; maxAttempts?: number; now?: () => Date },
) {
  const adapterByChannel = new Map(adapters.map((adapter) => [adapter.channelKey, adapter]));
  const batchSize = options.batchSize ?? 25;
  const leaseMs = options.leaseMs ?? 60_000;
  const maxAttempts = options.maxAttempts ?? 5;
  const now = options.now ?? (() => new Date());

  return {
    async runOnce() {
      const events = await repository.claim({ workerId: options.workerId, limit: batchSize, leaseMs });
      const summary = { claimed: events.length, processed: 0, failed: 0, deliveries: 0 };

      for (const event of events) {
        try {
          const targets = await repository.resolveDeliveries(event);
          for (const target of targets) {
            const idempotencyKey = `${event.id}:${target.channelKey}:${target.recipientKey}`;
            const adapter = adapterByChannel.get(target.channelKey);
            if (!adapter) throw new Error(`لا يوجد Adapter لقناة ${target.channelKey}`);
            try {
              const result = await adapter.deliver({ event, tenantId: target.tenantId, recipientKey: target.recipientKey, idempotencyKey });
              await repository.markDeliverySucceeded(event.id, idempotencyKey, result.providerMessageId);
              summary.deliveries += 1;
            } catch (error) {
              const retryAt = new Date(now().getTime() + retryDelayMs(event.attempts));
              await repository.markDeliveryFailed(event.id, idempotencyKey, { error: cleanError(error), retryAt });
              throw error;
            }
          }
          await repository.markEventProcessed(event.id, options.workerId);
          summary.processed += 1;
        } catch (error) {
          const attempt = event.attempts;
          await repository.rescheduleEvent(event.id, options.workerId, {
            error: cleanError(error),
            retryAt: new Date(now().getTime() + retryDelayMs(attempt)),
            deadLetter: attempt >= maxAttempts,
          });
          summary.failed += 1;
        }
      }
      return summary;
    },
  };
}
