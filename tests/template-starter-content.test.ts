import { describe, expect, it } from "vitest";

import {
  parseTemplateStarterContent,
  personalizeTemplateStarterContent
} from "@/modules/themes/template-starter-content";
import {
  applyTemplateStarterSharedDefaults,
  OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
} from "@/modules/themes/template-starter-defaults";
import { templateDefinitions } from "@/modules/themes/definitions";

describe("template starter content", () => {
  it("requires complete starter content for every registered template", () => {
    for (const template of templateDefinitions) {
      const content = parseTemplateStarterContent(template.starterContent);

      expect(content.sections.hero).toBeDefined();
      expect(content.sections.contact).toBeDefined();
      expect(content.contact).toBeDefined();
      expect(content.contact.workLocation).toBe("فريلانسر");
      expect(content.contact.tiktok).toBeTruthy();
      expect(content.sections.hero).toMatchObject({
        overlay: expect.any(String),
        position: expect.any(String),
        height: expect.any(String),
        cta: { label: expect.any(String), target: expect.any(String) },
        settings: { eyebrow: expect.any(String) },
      });
      expect(content.packages.length).toBeGreaterThanOrEqual(3);
      expect(content.packages.every((item) => item.priceAmount > 0)).toBe(true);
      expect(content.extras.length).toBeGreaterThan(0);
      expect(content.gallery.images.length).toBeGreaterThan(0);
    }
  });

  it("applies the official shared identity to every registered template", () => {
    for (const template of templateDefinitions) {
      const content = applyTemplateStarterSharedDefaults(
        parseTemplateStarterContent(template.starterContent),
      );

      expect(content.site.title).toBe("Kareem Magdy");
      expect(content.contact.studioName).toBe("Photography");
      expect(content.site.description).toBe("Wedding Photographer\nمصور زفاف");
      expect(content.sections.hero.subheadline).toBe(OFFICIAL_TEMPLATE_STARTER_DEFAULTS.description);
    }
  });

  it("personalizes only photographer identity fields", () => {
    const original = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
    );
    const personalized = personalizeTemplateStarterContent(original, "ليلى أحمد");
    const expected = structuredClone(original);

    expected.site.title = "ليلى أحمد";
    expected.sections.hero.headline = "ليلى أحمد";
    expected.seo.title = "ليلى أحمد";
    expected.seo.structuredData.name = "ليلى أحمد";

    expect(personalized).toEqual(expected);
    expect(personalized.contact.studioName).toBe("Photography");
    expect(personalized.site.description).toBe("Wedding Photographer\nمصور زفاف");
    expect(original.site.title).toBe("Kareem Magdy");
  });

  it("uses a template override only when explicitly provided", () => {
    const content = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
      OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
      { studioName: "Editorial House" },
    );

    expect(content.contact.studioName).toBe("Editorial House");
    expect(content.site.title).toBe("Kareem Magdy");
  });
});
