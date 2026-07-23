export type TrialPolicyRecord = {
  id: string;
  productId: string | null;
  offeringId: string;
  durationDays: number | null;
  usageLimit: number | null;
  usageCapabilityKey: string | null;
  graceDays: number;
  oncePerTenant: boolean;
  isActive: boolean;
  capabilities: Array<{ capabilityId: string | null; capabilityKey: string; value: unknown; quantity: number | null }>;
};

export interface TrialRepository {
  getPolicy(policyId: string): Promise<TrialPolicyRecord | null>;
  assertEligible(tenantId: string, policyId: string): Promise<void>;
  hasPreviousGrant(tenantId: string, offeringId: string): Promise<boolean>;
  createGrant(input: {
    tenantId: string;
    productId: string | null;
    offeringId: string;
    idempotencyKey: string;
    startsAt: Date;
    endsAt: Date | null;
    graceEndsAt: Date | null;
    usageLimit: number | null;
  }): Promise<{ id: string; status: "ACTIVE"; startsAt: Date; endsAt: Date | null; graceEndsAt: Date | null; usageLimit: number | null }>;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function createTrialService(
  repository: TrialRepository,
  now: () => Date = () => new Date(),
  dependencies?: {
    grantEntitlement(input: { tenantId: string; productId: string | null; offeringId: string; capabilityId: string | null; capabilityKey: string; value: unknown; quantity?: number | null; sourceType: "TRIAL_GRANT"; sourceId: string; startsAt: Date; endsAt: Date | null }): Promise<unknown>;
  },
) {
  return {
    async start(input: { tenantId: string; policyId: string; idempotencyKey: string }) {
      const policy = await repository.getPolicy(input.policyId);
      if (!policy?.isActive) throw new Error("Trial policy is not active.");
      await repository.assertEligible(input.tenantId, input.policyId);
      if (policy.oncePerTenant && await repository.hasPreviousGrant(input.tenantId, policy.offeringId)) {
        throw new Error("This tenant has already used this trial.");
      }
      const startsAt = now();
      const endsAt = policy.durationDays == null ? null : addDays(startsAt, policy.durationDays);
      const graceEndsAt = endsAt && policy.graceDays > 0 ? addDays(endsAt, policy.graceDays) : endsAt;
      const grant = await repository.createGrant({
        tenantId: input.tenantId,
        productId: policy.productId,
        offeringId: policy.offeringId,
        idempotencyKey: input.idempotencyKey,
        startsAt,
        endsAt,
        graceEndsAt,
        usageLimit: policy.usageLimit,
      });
      if (dependencies) {
        for (const capability of policy.capabilities) {
          await dependencies.grantEntitlement({
            tenantId: input.tenantId,
            productId: policy.productId,
            offeringId: policy.offeringId,
            capabilityId: capability.capabilityId,
            capabilityKey: capability.capabilityKey,
            value: capability.value,
            quantity: capability.quantity,
            sourceType: "TRIAL_GRANT",
            sourceId: grant.id,
            startsAt,
            endsAt: graceEndsAt,
          });
        }
      }
      return grant;
    },
  };
}
