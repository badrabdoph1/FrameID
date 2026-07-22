export class UsageLimitExceededError extends Error {
  constructor(
    readonly capabilityKey: string,
    readonly limit: number,
    readonly attempted: number,
  ) {
    super(`Usage limit exceeded for ${capabilityKey}: ${attempted}/${limit}`);
    this.name = "UsageLimitExceededError";
  }
}

export interface UsageRepository {
  consume(input: { tenantId: string; capabilityKey: string; amount: number; idempotencyKey: string; metadata?: unknown }): Promise<{ consumed: number; limit: number | null; duplicate: boolean }>;
}

export function createUsageService(repository: UsageRepository) {
  return {
    async consume(input: { tenantId: string; capabilityKey: string; amount: number; idempotencyKey: string; metadata?: unknown }) {
      if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error("Usage amount must be a positive integer.");
      const result = await repository.consume(input);
      return {
        consumed: result.consumed,
        remaining: result.limit == null ? null : Math.max(0, result.limit - result.consumed),
        duplicate: result.duplicate,
      };
    },
  };
}
