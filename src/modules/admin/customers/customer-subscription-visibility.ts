import {
  getSubscriptionCardVisibilityPreference,
  resolveSubscriptionCardVisibility,
  setSubscriptionCardVisibilityPreference,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionCardVisibilityPreference,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceDefaults,
  type SubscriptionExperienceOverride,
} from "@/modules/subscription/subscription-experience";

type Actor = { id: string; name: string };

export type CustomerSubscriptionVisibilityAuditEntry = {
  actorId: string;
  action: string;
  metadata: Record<string, unknown>;
};

export type CustomerSubscriptionVisibilityRepository = {
  getDefaults(): Promise<{
    defaults: SubscriptionExperienceDefaults;
    sourceFallbackUsed: boolean;
  }>;
  getOverride(tenantId: string): Promise<SubscriptionExperienceOverride | null>;
  persist(input: {
    tenantId: string;
    override: SubscriptionExperienceOverride | null;
    audit: CustomerSubscriptionVisibilityAuditEntry;
  }): Promise<void>;
};

export function createCustomerSubscriptionVisibilityService(
  repository: CustomerSubscriptionVisibilityRepository,
) {
  return {
    async updateVisibility(input: {
      tenantId: string;
      bucket: SubscriptionExperienceBucket;
      preference: SubscriptionCardVisibilityPreference;
      actor: Actor;
      now?: Date;
    }) {
      const [defaultsRecord, current] = await Promise.all([
        repository.getDefaults(),
        repository.getOverride(input.tenantId),
      ]);
      const { defaults, sourceFallbackUsed } = defaultsRecord;
      const previousPreference = getSubscriptionCardVisibilityPreference(
        current?.[input.bucket],
      );
      const previousVisibility = resolveSubscriptionCardVisibility({
        defaultEnabled: defaults[input.bucket].message.enabled,
        preference: previousPreference,
        sourceFallbackUsed,
      });
      const next = setSubscriptionCardVisibilityPreference({
        override: current,
        bucket: input.bucket,
        preference: input.preference,
        actor: input.actor,
        now: input.now,
      });

      const visibility = resolveSubscriptionCardVisibility({
        defaultEnabled: defaults[input.bucket].message.enabled,
        preference: input.preference,
        sourceFallbackUsed,
      });
      await repository.persist({
        tenantId: input.tenantId,
        override: Object.values(next).some(Boolean) ? next : null,
        audit: {
          actorId: input.actor.id,
          action: "CUSTOMER_SUBSCRIPTION_CARD_VISIBILITY_UPDATED",
          metadata: {
            tenantId: input.tenantId,
            bucket: input.bucket,
            previousPreference,
            nextPreference: input.preference,
            previousEffective: previousVisibility.effective,
            nextEffective: visibility.effective,
            previousSource: previousVisibility.source,
            nextSource: visibility.source,
            actorName: input.actor.name,
          },
        },
      });

      return { override: next, visibility };
    },

    async clearAll(input: { tenantId: string; actor: Actor }) {
      const current = await repository.getOverride(input.tenantId);
      const clearedBuckets = subscriptionExperienceBucketDefinitions
        .map((item) => item.value)
        .filter((bucket) => Boolean(current?.[bucket]));

      await repository.persist({
        tenantId: input.tenantId,
        override: null,
        audit: {
          actorId: input.actor.id,
          action: "CUSTOMER_SUBSCRIPTION_EXPERIENCE_OVERRIDES_CLEARED",
          metadata: {
            tenantId: input.tenantId,
            clearedBuckets,
            previousOverride: current ?? {},
            actorName: input.actor.name,
          },
        },
      });

      return { clearedBuckets };
    },
  };
}
