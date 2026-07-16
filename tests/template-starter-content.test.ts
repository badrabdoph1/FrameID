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
      expect(content.site.description).toBe("Wedding Photographer\nمصور زفاف");
      expect(content.sections.hero.subheadline).toBe(OFFICIAL_TEMPLATE_STARTER_DEFAULTS.description);
    }
  });

  it("personalizes photographer identity and clears placeholder data", () => {
    const original = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
    );
    const personalized = personalizeTemplateStarterContent(original, "ليلى أحمد", {
      identifierKind: "phone",
      phone: "+20123456789",
    });

    expect(personalized.site.title).toBe("ليلى أحمد");
    expect(personalized.sections.hero.headline).toBe("ليلى أحمد");
    expect(personalized.seo.title).toBe("ليلى أحمد");
    expect(personalized.seo.structuredData.name).toBe("ليلى أحمد");
    expect(personalized.contact.studioName).toBe("ليلى أحمد");
    expect(personalized.contact.phone).toBe("+20123456789");
    expect(personalized.contact.whatsapp).toBe("+20123456789");
    expect(personalized.contact.email).toBeNull();
    expect(personalized.contact.instagram).toBeNull();
    expect(personalized.contact.facebook).toBeNull();
    expect(personalized.contact.tiktok).toBeNull();
    expect(personalized.contact.bio).toBeNull();
    expect(personalized.contact.longDescription).toBeNull();
    expect(original.site.title).toBe("Kareem Magdy");
  });

  it("uses email identity when phone is not provided", () => {
    const original = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
    );
    const personalized = personalizeTemplateStarterContent(original, "محمد علي", {
      identifierKind: "email",
      email: "mohamed@example.com",
    });

    expect(personalized.contact.studioName).toBe("محمد علي");
    expect(personalized.contact.email).toBe("mohamed@example.com");
    expect(personalized.contact.phone).toBeNull();
    expect(personalized.contact.whatsapp).toBeNull();
  });
});
