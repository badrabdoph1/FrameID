export type ServiceSubscriptionLifecycleStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "GRACE_PERIOD" | "CANCELLED" | "EXPIRED" | "SUSPENDED";

export type ServiceSubscriptionRecord = {
  id: string;
  tenantId: string;
  status: ServiceSubscriptionLifecycleStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
};

export interface ServiceSubscriptionRepository {
  getById(id: string): Promise<ServiceSubscriptionRecord | null>;
  update(input: {
    id: string;
    status: ServiceSubscriptionLifecycleStatus;
    idempotencyKey: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    gracePeriodEndsAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date | null;
    cancellationReason?: string | null;
  }): Promise<{ id: string; status: ServiceSubscriptionLifecycleStatus }>;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function createServiceSubscriptionService(repository: ServiceSubscriptionRepository, now: () => Date = () => new Date()) {
  async function get(id: string) {
    const subscription = await repository.getById(id);
    if (!subscription) throw new Error(`Service subscription not found: ${id}`);
    return subscription;
  }
  return {
    async renew(input: { subscriptionId: string; periodStart: Date; periodEnd: Date; idempotencyKey: string }) {
      const subscription = await get(input.subscriptionId);
      if (["CANCELLED", "EXPIRED"].includes(subscription.status)) throw new Error(`Cannot renew ${subscription.status} subscription.`);
      if (input.periodEnd <= input.periodStart) throw new Error("Subscription period end must follow period start.");
      return repository.update({
        id: subscription.id,
        status: "ACTIVE",
        currentPeriodStart: input.periodStart,
        currentPeriodEnd: input.periodEnd,
        gracePeriodEndsAt: null,
        cancelAtPeriodEnd: false,
        idempotencyKey: input.idempotencyKey,
      });
    },
    async enterGrace(input: { subscriptionId: string; graceDays: number; idempotencyKey: string }) {
      const subscription = await get(input.subscriptionId);
      if (subscription.status !== "PAST_DUE") throw new Error("Only past-due subscriptions can enter grace period.");
      if (!Number.isSafeInteger(input.graceDays) || input.graceDays < 1) throw new Error("Grace days must be positive.");
      return repository.update({
        id: subscription.id,
        status: "GRACE_PERIOD",
        gracePeriodEndsAt: addDays(now(), input.graceDays),
        idempotencyKey: input.idempotencyKey,
      });
    },
    async cancel(input: { subscriptionId: string; atPeriodEnd: boolean; reason: string; idempotencyKey: string }) {
      const subscription = await get(input.subscriptionId);
      if (["CANCELLED", "EXPIRED"].includes(subscription.status)) return { id: subscription.id, status: subscription.status };
      return repository.update({
        id: subscription.id,
        status: input.atPeriodEnd ? subscription.status : "CANCELLED",
        cancelAtPeriodEnd: input.atPeriodEnd,
        cancelledAt: input.atPeriodEnd ? null : now(),
        cancellationReason: input.reason,
        idempotencyKey: input.idempotencyKey,
      });
    },
    async expire(input: { subscriptionId: string; idempotencyKey: string }) {
      const subscription = await get(input.subscriptionId);
      if (!(["GRACE_PERIOD", "PAST_DUE", "ACTIVE"] as ServiceSubscriptionLifecycleStatus[]).includes(subscription.status)) {
        throw new Error(`Cannot expire ${subscription.status} subscription.`);
      }
      return repository.update({ id: subscription.id, status: "EXPIRED", idempotencyKey: input.idempotencyKey });
    },
  };
}
