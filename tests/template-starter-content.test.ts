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
      expect(content.packages.length).toBeGreaterThanOrEqual(3);
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

  it("personalizes only photographer identity fields when no registration contact is supplied", () => {
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

  it("uses the signup phone for both phone and WhatsApp without changing the rest of the template", () => {
    const original = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
    );
    const personalized = personalizeTemplateStarterContent(original, "أحمد علي", {
      identifierKind: "phone",
      phone: "+201012345678",
    });

    expect(personalized.contact.phone).toBe("+201012345678");
    expect(personalized.contact.whatsapp).toBe("+201012345678");
    expect(personalized.contact.email).toBe(original.contact.email);
    expect(personalized.contact.instagram).toBe(original.contact.instagram);
    expect(personalized.contact.facebook).toBe(original.contact.facebook);
    expect(personalized.contact.studioName).toBe(original.contact.studioName);
    expect(personalized.gallery).toEqual(original.gallery);
    expect(personalized.packages).toEqual(original.packages);
    expect(personalized.extras).toEqual(original.extras);
  });

  it("uses the signup email without replacing template phone or WhatsApp", () => {
    const original = applyTemplateStarterSharedDefaults(
      parseTemplateStarterContent(templateDefinitions[0].starterContent),
    );
    const personalized = personalizeTemplateStarterContent(original, "أحمد علي", {
      identifierKind: "email",
      email: "ahmed@example.com",
    });

    expect(personalized.contact.email).toBe("ahmed@example.com");
    expect(personalized.contact.phone).toBe(original.contact.phone);
    expect(personalized.contact.whatsapp).toBe(original.contact.whatsapp);
    expect(personalized.contact.studioName).toBe(original.contact.studioName);
    expect(personalized.sections.hero.imageUrl).toBe(original.sections.hero.imageUrl);
    expect(personalized.themeSettings).toEqual(original.themeSettings);
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
