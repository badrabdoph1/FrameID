export type ClaimedServicesEvent = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventName: string;
  eventVersion: number;
  payload: Record<string, unknown>;
  attempts: number;
  correlationId?: string | null;
};

export type ServicesEventHandler = {
  eventName: string;
  handle(event: ClaimedServicesEvent): Promise<void>;
};

export interface ServicesOutboxRepository {
  claim(input: { workerId: string; limit: number; leaseMs: number }): Promise<ClaimedServicesEvent[]>;
  markProcessed(eventId: string, leaseOwner: string): Promise<void>;
  reschedule(eventId: string, leaseOwner: string, input: { error: string; retryAt: Date; deadLetter: boolean }): Promise<void>;
}

function cleanError(error: unknown) {
  return (error instanceof Error ? error.message : "Unknown services event failure")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}

function retryDelayMs(attempts: number) {
  return Math.min(30 * 60_000, 15_000 * (2 ** Math.max(0, attempts - 1)));
}

export function createServicesOutboxWorker(
  repository: ServicesOutboxRepository,
  handlers: readonly ServicesEventHandler[],
  options: { workerId: string; batchSize?: number; leaseMs?: number; maxAttempts?: number; now?: () => Date },
) {
  const now = options.now ?? (() => new Date());
  const batchSize = options.batchSize ?? 50;
  const leaseMs = options.leaseMs ?? 60_000;
  const maxAttempts = options.maxAttempts ?? 5;
  return {
    async runOnce() {
      const events = await repository.claim({ workerId: options.workerId, limit: batchSize, leaseMs });
      const summary = { claimed: events.length, processed: 0, failed: 0 };
      for (const event of events) {
        try {
          for (const handler of handlers.filter((candidate) => candidate.eventName === event.eventName || candidate.eventName === "*")) {
            await handler.handle(event);
          }
          await repository.markProcessed(event.id, options.workerId);
          summary.processed += 1;
        } catch (error) {
          await repository.reschedule(event.id, options.workerId, {
            error: cleanError(error),
            retryAt: new Date(now().getTime() + retryDelayMs(event.attempts)),
            deadLetter: event.attempts >= maxAttempts,
          });
          summary.failed += 1;
        }
      }
      return summary;
    },
  };
}
