import { describe, expect, it } from "vitest";

import {
  assertTemplateCode,
  buildTemplateDefaults,
  nextAvailableTemplateCode,
  normalizeTemplateCode,
} from "@/modules/templates/template-admin-policy";

describe("template admin policy", () => {
  it("normalizes a human template name into a safe code", () => {
    expect(normalizeTemplateCode("  Classic Studio 2026  ")).toBe("classic-studio-2026");
  });

  it("rejects empty or unsafe template codes", () => {
    expect(() => assertTemplateCode("--")).toThrow("كود القالب");
  });

  it("creates a unique duplicate code without overwriting an existing template", () => {
    expect(nextAvailableTemplateCode("classic-copy", new Set(["classic-copy", "classic-copy-2"]))).toBe("classic-copy-3");
  });

  it("builds simple editable defaults without exposing technical json", () => {
    expect(buildTemplateDefaults({
      name: "Classic",
      description: "Premium template",
      themeDefaultConfig: { palette: "gold" },
    })).toEqual({
      previewData: {
        title: "Classic",
        headline: "Classic",
        description: "Premium template",
        subtitle: "Premium template",
        callToAction: "احجز الآن",
        hero: {
          headline: "Classic",
          subheadline: "Premium template",
        },
        packages: [],
        extras: [],
      },
      settings: { palette: "gold" },
    });
  });
});
