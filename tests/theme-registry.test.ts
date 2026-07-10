import { describe, expect, it } from "vitest";

import {
  createThemeRegistry,
  getPublishedTemplates,
  getTemplateByCode,
  themeRegistry
} from "@/modules/themes/theme-registry";

describe("theme registry", () => {
  it("returns only published templates in showroom order", () => {
    expect(getPublishedTemplates().map((template) => template.code)).toEqual([
      "noir-gold",
      "rose-blush"
    ]);
  });

  it("finds a template by code", () => {
    expect(getTemplateByCode("noir-gold")).toMatchObject({
      code: "noir-gold",
      themeCode: "noir-gold",
      status: "published",
      starterContent: {
        sections: {
          hero: expect.any(Object),
          contact: expect.any(Object)
        }
      }
    });
  });

  it("exposes theme metadata separately from template presets", () => {
    expect(themeRegistry.getTheme("noir-gold")).toMatchObject({
      code: "noir-gold",
      supportedSections: ["hero", "gallery", "packages", "extras", "contact"]
    });
  });

  it("rejects duplicate theme or template codes during registration", () => {
    expect(() =>
      createThemeRegistry({
        themes: [
          {
            code: "duplicate",
            name: "Duplicate",
            version: "1.0.0",
            status: "published",
            supportedSections: ["hero"],
            defaultConfig: {}
          },
          {
            code: "duplicate",
            name: "Duplicate Again",
            version: "1.0.0",
            status: "published",
            supportedSections: ["hero"],
            defaultConfig: {}
          }
        ],
        templates: []
      })
    ).toThrow("Duplicate theme code");
  });
});
