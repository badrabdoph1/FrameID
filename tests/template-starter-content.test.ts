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

    expect(personalized.site.title).toBe("ليلى أحمد");
    expect(personalized.contact.studioName).toBe("ليلى أحمد");
    expect(personalized.sections.hero.headline).toBe("ليلى أحمد");
    expect(personalized.seo.title).toBe("ليلى أحمد");
    expect(personalized.seo.structuredData.name).toBe("ليلى أحمد");
    expect(personalized.packages.map((item) => item.priceAmount)).toEqual(
      original.packages.map((item) => item.priceAmount)
    );
    expect(personalized.gallery.images.map((item) => item.url)).toEqual(
      original.gallery.images.map((item) => item.url)
    );
    expect(original.site.title).not.toBe("ليلى أحمد");
  });
});
