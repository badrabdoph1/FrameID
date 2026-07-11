import type { SanitizedIssuePayload, SanitizedIssueValue } from "./types";

const MAX_DEPTH = 4;
const MAX_ARRAY_LENGTH = 30;
const MAX_OBJECT_KEYS = 60;
const DEFAULT_STRING_LENGTH = 1_024;
const LONG_STRING_KEYS = new Set(["message", "customerNote", "resolutionNote"]);
const STACK_KEYS = new Set(["stack", "cause"]);
const SENSITIVE_KEY = /(?:password|passcode|secret|token|cookie|authorization|csrf|sessiontoken|creditcard|cardnumber|cvv|cvc|iban|paymentproof|resettoken)/i;
const SENSITIVE_QUERY_KEY = /(?:token|code|secret|password|passcode|key|signature|authorization|reset)/i;

function stringLimit(key: string): number {
  if (STACK_KEYS.has(key)) return 12_000;
  if (LONG_STRING_KEYS.has(key)) return 2_000;
  return DEFAULT_STRING_LENGTH;
}

function sanitizeValue(value: unknown, key: string, depth: number): SanitizedIssueValue | undefined {
  if (value === null) return null;
  if (typeof value === "string") return value.slice(0, stringLimit(key));
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol") return undefined;
  if (depth >= MAX_DEPTH) return "[depth-limit]";

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).flatMap((item) => {
      const sanitized = sanitizeValue(item, key, depth + 1);
      return sanitized === undefined ? [] : [sanitized];
    });
  }

  if (typeof value === "object") {
    const result: Record<string, SanitizedIssueValue> = {};
    for (const [childKey, childValue] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
      if (SENSITIVE_KEY.test(childKey)) continue;
      const sanitized = sanitizeValue(childValue, childKey, depth + 1);
      if (sanitized !== undefined) result[childKey] = sanitized;
    }
    return result;
  }

  return undefined;
}

export function sanitizeIssueUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://frameid.invalid");
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEY.test(key)) url.searchParams.delete(key);
    }
    const suffix = `${url.pathname}${url.search}${url.hash}`;
    return url.origin === "https://frameid.invalid" ? suffix : `${url.origin}${suffix}`;
  } catch {
    return value.split("?")[0]?.slice(0, 2_000) ?? null;
  }
}

export function sanitizeIssuePayload(input: Record<string, unknown>): SanitizedIssuePayload {
  const result = sanitizeValue(input, "root", 0);
  return result && !Array.isArray(result) && typeof result === "object" ? result : {};
}
