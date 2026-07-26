export type EntitlementAggregationPolicy = "REPLACE" | "SUM" | "MAX" | "UNION" | "BOOLEAN_OR";

export type EntitlementGrant = {
  id: string;
  capabilityKey: string;
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED";
  value: unknown;
  aggregationPolicy: EntitlementAggregationPolicy;
  startsAt: Date;
  endsAt: Date | null;
};

function aggregate(policy: EntitlementAggregationPolicy, grants: EntitlementGrant[]): unknown {
  const values = grants.map((grant) => grant.value);
  switch (policy) {
    case "SUM":
      return values.reduce<number>((total, value) => total + (typeof value === "number" ? value : 0), 0);
    case "MAX":
      return Math.max(...values.filter((value): value is number => typeof value === "number"));
    case "UNION":
      return [...new Set(values.flatMap((value) => Array.isArray(value) ? value : [value]))];
    case "BOOLEAN_OR":
      return values.some(Boolean);
    case "REPLACE":
    default:
      return grants.at(-1)?.value;
  }
}

export function resolveEntitlements(grants: readonly EntitlementGrant[], at: Date = new Date()) {
  const active = grants
    .filter((grant) => grant.status === "ACTIVE" && grant.startsAt <= at && (!grant.endsAt || grant.endsAt > at))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const grouped = new Map<string, EntitlementGrant[]>();
  for (const grant of active) {
    const group = grouped.get(grant.capabilityKey) ?? [];
    group.push(grant);
    grouped.set(grant.capabilityKey, group);
  }

  const capabilities: Record<string, { value: unknown; sourceIds: string[]; aggregationPolicy: EntitlementAggregationPolicy }> = {};
  for (const [capabilityKey, group] of grouped) {
    const policy = group[0].aggregationPolicy;
    capabilities[capabilityKey] = {
      value: aggregate(policy, group),
      sourceIds: group.map((grant) => grant.id),
      aggregationPolicy: policy,
    };
  }

  return { capabilities, resolvedAt: at };
}
