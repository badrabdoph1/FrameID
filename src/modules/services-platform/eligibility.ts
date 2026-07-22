export type EligibilityContext = {
  tenantId: string;
  planCodes?: readonly string[];
  customerType?: string;
  country?: string;
  language?: string;
  siteCount?: number;
  activeProductCodes?: readonly string[];
  customerAgeDays?: number;
  activityScore?: number;
  accessTiers?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
};

export type EligibilityOperator = "EQ" | "NEQ" | "IN" | "HAS" | "GTE" | "LTE";

export type EligibilityPredicate = {
  field: string;
  operator: EligibilityOperator;
  value: unknown;
  reasonCode?: string;
};

export type EligibilityPolicy = {
  all?: readonly EligibilityPredicate[];
  any?: readonly EligibilityPredicate[];
  deny?: readonly EligibilityPredicate[];
  visibleWhen?: readonly EligibilityPredicate[];
  recommendWhen?: readonly EligibilityPredicate[];
  ctaMode?: "BUY" | "REQUEST" | "CONTACT" | "JOIN_BETA";
};

export type EligibilityResult = {
  visible: boolean;
  eligible: boolean;
  purchasable: boolean;
  recommended: boolean;
  reasonCodes: string[];
  ctaMode: "BUY" | "REQUEST" | "CONTACT" | "JOIN_BETA" | "REQUEST_ACCESS" | "HIDDEN";
};

const knownFields = new Set([
  "tenantId",
  "planCodes",
  "customerType",
  "country",
  "language",
  "siteCount",
  "activeProductCodes",
  "customerAgeDays",
  "activityScore",
  "accessTiers",
]);

function readField(context: EligibilityContext, field: string): unknown {
  if (knownFields.has(field)) return context[field as keyof EligibilityContext];
  if (field.startsWith("attributes.")) return context.attributes?.[field.slice("attributes.".length)];
  return undefined;
}

function matches(context: EligibilityContext, predicate: EligibilityPredicate): boolean {
  const actual = readField(context, predicate.field);
  if (actual === undefined) return false;

  switch (predicate.operator) {
    case "EQ": return actual === predicate.value;
    case "NEQ": return actual !== predicate.value;
    case "IN": return Array.isArray(predicate.value) && predicate.value.includes(actual);
    case "HAS": return Array.isArray(actual) && actual.includes(predicate.value);
    case "GTE": return typeof actual === "number" && typeof predicate.value === "number" && actual >= predicate.value;
    case "LTE": return typeof actual === "number" && typeof predicate.value === "number" && actual <= predicate.value;
    default: return false;
  }
}

function allMatch(context: EligibilityContext, predicates: readonly EligibilityPredicate[] | undefined): boolean {
  return !predicates?.length || predicates.every((predicate) => matches(context, predicate));
}

export function evaluateOfferingEligibility(
  context: EligibilityContext,
  policy: EligibilityPolicy | null | undefined,
): EligibilityResult {
  if (!policy) {
    return { visible: true, eligible: true, purchasable: true, recommended: false, reasonCodes: [], ctaMode: "BUY" };
  }

  const denied = policy.deny?.find((predicate) => matches(context, predicate));
  if (denied) {
    return {
      visible: false,
      eligible: false,
      purchasable: false,
      recommended: false,
      reasonCodes: [denied.reasonCode ?? "EXPLICITLY_DENIED"],
      ctaMode: "HIDDEN",
    };
  }

  const allAllowed = allMatch(context, policy.all);
  const anyAllowed = !policy.any?.length || policy.any.some((predicate) => matches(context, predicate));
  const visible = allMatch(context, policy.visibleWhen);
  const eligible = allAllowed && anyAllowed;
  const recommended = eligible && Boolean(policy.recommendWhen?.length) && allMatch(context, policy.recommendWhen);
  const failed = [...(policy.all ?? []), ...(policy.any ?? [])]
    .filter((predicate) => !matches(context, predicate))
    .map((predicate) => predicate.reasonCode ?? `POLICY_${predicate.field.toUpperCase()}_${predicate.operator}`);

  return {
    visible,
    eligible,
    purchasable: visible && eligible,
    recommended,
    reasonCodes: eligible ? [] : [...new Set(failed.length ? failed : ["NOT_ELIGIBLE"])],
    ctaMode: !visible ? "HIDDEN" : eligible ? (policy.ctaMode ?? "BUY") : "REQUEST_ACCESS",
  };
}
