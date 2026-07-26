import type { EntitlementGrant } from "./entitlement-resolver";
import { resolveEntitlements } from "./entitlement-resolver";

export type GrantEntitlementInput = {
  tenantId: string;
  productId?: string | null;
  offeringId?: string | null;
  capabilityId?: string | null;
  capabilityKey: string;
  value: unknown;
  quantity?: number | null;
  sourceType: string;
  sourceId: string;
  startsAt?: Date;
  endsAt?: Date | null;
};

export interface EntitlementRepository {
  upsertGrant(input: GrantEntitlementInput): Promise<{ id: string }>;
  revokeSource(input: { tenantId: string; sourceType: string; sourceId: string; reason: string; revokedAt: Date }): Promise<number>;
  listActive(tenantId: string, at: Date): Promise<EntitlementGrant[]>;
}

export function createEntitlementService(
  repository: EntitlementRepository,
  now: () => Date = () => new Date(),
) {
  return {
    grant(input: GrantEntitlementInput) {
      return repository.upsertGrant(input);
    },
    revokeSource(input: { tenantId: string; sourceType: string; sourceId: string; reason: string }) {
      return repository.revokeSource({ ...input, revokedAt: now() });
    },
    async resolve(tenantId: string, at: Date = now()) {
      return resolveEntitlements(await repository.listActive(tenantId, at), at);
    },
  };
}
