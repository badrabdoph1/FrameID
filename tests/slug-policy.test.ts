import { describe, expect, it } from "vitest";

import {
  generateSlugSuggestions,
  getSlugAvailabilityState,
  normalizeSlugInput,
  validateSiteSlug
} from "@/modules/sites/slug-policy";

describe("site slug policy", () => {
  it("normalizes names into lowercase URL-safe slugs", () => {
    expect(normalizeSlugInput("  Ali Ahmed Photography  ")).toBe(
      "ali-ahmed-photography"
    );
  });

  it("rejects reserved slugs used by platform routes", () => {
    expect(validateSiteSlug("admin")).toEqual({
      ok: false,
      reason: "reserved"
    });
  });

  it("rejects malformed slugs", () => {
    expect(validateSiteSlug("-ali")).toEqual({
      ok: false,
      reason: "format"
    });
  });

  it("suggests deterministic alternatives when a slug is unavailable", () => {
    expect(generateSlugSuggestions("Ali Ahmed")).toEqual([
      "ali-ahmed-studio",
      "ali-ahmed-photo",
      "ali-ahmed-gallery"
    ]);
  });

  it("reports availability separately from syntax validation", () => {
    expect(getSlugAvailabilityState("ali-ahmed", new Set(["ali-ahmed"]))).toEqual({
      ok: false,
      reason: "taken",
      normalizedSlug: "ali-ahmed"
    });
  });
});
