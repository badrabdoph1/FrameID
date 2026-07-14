import { describe, expect, it } from "vitest";

import {
  createThemeRegistry,
  getPublishedTemplates,
  getTemplateByCode,
  themeRegistry
} from "@/modules/themes/theme-registry";
import type { TemplateSummary } from "@/modules/themes/theme-registry";

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

  it("rejects templates without starter content during registration", () => {
    expect(() =>
      createThemeRegistry({
        themes: [
          {
            code: "theme-without-starter-content",
            name: "Theme",
            version: "1.0.0",
            status: "published",
            supportedSections: ["hero"],
            defaultConfig: {}
          }
        ],
        templates: [
          {
            code: "template-without-starter-content",
            themeCode: "theme-without-starter-content",
            name: "Template",
            status: "published",
            showroomOrder: 1,
            description: "Template without starter content"
          } as TemplateSummary
        ]
      })
    ).toThrow("Template template-without-starter-content is missing starter content");
  });

  it("rejects themes that implement only part of the platform contract", () => {
    expect(() => createThemeRegistry({
      themes: [{ code: "partial", name: "Partial", version: "1.0.0", status: "published", supportedSections: ["hero"], defaultConfig: {} }],
      templates: []
    })).toThrow("Theme partial must implement the complete platform template contract");
  });
});
