import { describe, expect, it } from "vitest";

import {
  parseTemplateStarterContent,
  personalizeTemplateStarterContent
} from "@/modules/themes/template-starter-content";
import { templateDefinitions } from "@/modules/themes/definitions";

describe("template starter content", () => {
  it("requires complete starter content for every registered template", () => {
    for (const template of templateDefinitions) {
      const content = parseTemplateStarterContent(template.starterContent);

      expect(content.sections.hero).toBeDefined();
      expect(content.sections.contact).toBeDefined();
      expect(content.contact).toBeDefined();
      expect(content.packages.length).toBeGreaterThanOrEqual(3);
      expect(content.extras.length).toBeGreaterThan(0);
      expect(content.gallery.images.length).toBeGreaterThan(0);
    }
  });

  it("personalizes only photographer identity fields", () => {
    const original = parseTemplateStarterContent(
      templateDefinitions[0].starterContent
    );
    const personalized = personalizeTemplateStarterContent(original, "ليلى أحمد");
    const expected = structuredClone(original);

    expected.site.title = "ليلى أحمد";
    expected.contact.studioName = "ليلى أحمد";
    expected.sections.hero.headline = "ليلى أحمد";
    expected.seo.title = "ليلى أحمد";
    expected.seo.structuredData.name = "ليلى أحمد";

    expect(personalized).toEqual(expected);
    expect(original.site.title).not.toBe("ليلى أحمد");
  });
});
