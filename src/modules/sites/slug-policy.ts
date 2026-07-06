export type SlugValidationResult =
  | { ok: true }
  | { ok: false; reason: "format" | "reserved" | "length" };

export type SlugAvailabilityState =
  | { ok: true; normalizedSlug: string }
  | {
      ok: false;
      normalizedSlug: string;
      reason: "format" | "reserved" | "length" | "taken";
    };

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "billing",
  "dashboard",
  "forgot-password",
  "login",
  "privacy",
  "settings",
  "signup",
  "support",
  "templates",
  "terms"
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 48;

export function normalizeSlugInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateSiteSlug(slug: string): SlugValidationResult {
  const normalizedSlug = normalizeSlugInput(slug);

  if (
    normalizedSlug.length < MIN_SLUG_LENGTH ||
    normalizedSlug.length > MAX_SLUG_LENGTH
  ) {
    return { ok: false, reason: "length" };
  }

  if (!SLUG_PATTERN.test(slug) || slug !== normalizedSlug) {
    return { ok: false, reason: "format" };
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, reason: "reserved" };
  }

  return { ok: true };
}

export function getSlugAvailabilityState(
  input: string,
  unavailableSlugs: ReadonlySet<string>
): SlugAvailabilityState {
  const normalizedSlug = normalizeSlugInput(input);
  const validation = validateSiteSlug(normalizedSlug);

  if (!validation.ok) {
    return {
      ok: false,
      normalizedSlug,
      reason: validation.reason
    };
  }

  if (unavailableSlugs.has(normalizedSlug)) {
    return {
      ok: false,
      normalizedSlug,
      reason: "taken"
    };
  }

  return { ok: true, normalizedSlug };
}

export function generateSlugSuggestions(input: string): string[] {
  const baseSlug = normalizeSlugInput(input);

  return ["studio", "photo", "gallery"].map((suffix) => `${baseSlug}-${suffix}`);
}
