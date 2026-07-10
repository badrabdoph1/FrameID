import { describe, expect, it } from "vitest";

import {
  buildPreviewSiteFromStarter,
  createSignupContentFromStarter,
  getTemplateStarterData,
  mergeTemplatePreviewData,
  personalizeTemplateStarterData
} from "@/modules/themes/template-starter-data";

describe("template starter data", () => {
  it.each(["noir-gold", "rose-blush"])("creates a complete preview and signup seed for %s", (code) => {
    const starter = getTemplateStarterData(code);
    expect(starter).not.toBeNull();

    const preview = buildPreviewSiteFromStarter(starter!);
    const signup = createSignupContentFromStarter(starter!);

    expect(preview.themeCode).toBe(starter!.themeCode);
    expect(preview.hero.headline).toBe(starter!.hero.headline);
    expect(preview.hero.subheadline).toBe(starter!.hero.subheadline);
    expect(preview.gallery.map((image) => image.url)).toEqual(starter!.gallery.map((image) => image.url));
    expect(preview.packages.map((item) => item.name)).toEqual(starter!.packages.map((item) => item.name));
    expect(preview.extras.map((item) => item.name)).toEqual(starter!.extras.map((item) => item.name));
    expect(signup.sections.map((section) => section.type)).toEqual(starter!.sections.map((section) => section.type));
    expect(signup.gallery.map((image) => image.url)).toEqual(starter!.gallery.map((image) => image.url));
    expect(signup.packages.map((item) => item.imageUrl)).toEqual(starter!.packages.map((item) => item.imageUrl));
  });

  it("replaces only the demo photographer identity with the signup owner name", () => {
    const starter = getTemplateStarterData("noir-gold")!;
    const personalized = personalizeTemplateStarterData(starter, "محمود سامي");

    expect(personalized.title).toBe("محمود سامي");
    expect(personalized.hero.headline).toBe("محمود سامي");
    expect(personalized.contact.studioName).toBe("محمود سامي");
    expect(personalized.packages).toEqual(starter.packages);
    expect(personalized.gallery).toEqual(starter.gallery);
    expect(personalized.extras).toEqual(starter.extras);
  });

  it("keeps old template preview data compatible with the new starter structure", () => {
    const starter = mergeTemplatePreviewData("noir-gold", {
      title: "قالب قديم",
      hero: { headline: "قالب قديم", subheadline: "وصف قديم" },
      packages: [
        { id: "old", name: "باقة قديمة", priceAmount: 7000, currency: "EGP", features: ["ميزة"] }
      ]
    });

    expect(starter.title).toBe("قالب قديم");
    expect(starter.hero.subheadline).toBe("وصف قديم");
    expect(starter.packages[0]).toMatchObject({ name: "باقة قديمة", priceAmount: 7000 });
    expect(starter.gallery.length).toBeGreaterThan(0);
  });
});
