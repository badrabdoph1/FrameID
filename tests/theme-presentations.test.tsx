import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NoirGoldPresentation } from "@/components/themes/noir-gold-presentation";
import { RoseBlushPresentation } from "@/components/themes/rose-blush-presentation";
import {
  buildTemplatePreviewViewModel,
  getTemplateContentSource,
} from "@/modules/templates/template-content-source";

describe.each([
  ["noir-gold", NoirGoldPresentation],
  ["rose-blush", RoseBlushPresentation],
] as const)("%s presentation", (code, Presentation) => {
  it("renders the unified contract in dashboard order with mobile contact actions", () => {
    const source = getTemplateContentSource(code);
    if (!source) throw new Error(`Missing ${code} source`);
    const site = buildTemplatePreviewViewModel(source);
    site.hero.overlay = "strong";
    site.hero.position = "top";
    site.hero.height = "tall";
    site.hero.cta = { label: "تواصل الآن", target: "contact" };
    site.orderedSections = [
      { ...site.sections.packages, type: "packages", sortOrder: 0 },
      { ...site.sections.hero, type: "hero", sortOrder: 1 },
      { ...site.sections.contact, type: "contact", sortOrder: 2 },
      { ...site.sections.gallery, type: "gallery", sortOrder: 3, isVisible: false },
      { ...site.sections.extras, type: "extras", sortOrder: 4 },
    ];

    const html = renderToStaticMarkup(<Presentation site={site} />);
    const packagesIndex = html.indexOf('data-template-section="packages"');
    const heroIndex = html.indexOf('data-template-section="hero"');
    const contactIndex = html.indexOf('data-template-section="contact"');
    const extrasIndex = html.indexOf('data-template-section="extras"');

    expect(packagesIndex).toBeGreaterThan(-1);
    expect(heroIndex).toBeGreaterThan(packagesIndex);
    expect(contactIndex).toBeGreaterThan(heroIndex);
    expect(extrasIndex).toBeGreaterThan(contactIndex);
    expect(html).not.toContain('data-template-section="gallery"');
    expect(html).toContain("تواصل الآن");
    expect(html).toContain("object-position:top");
    expect(html).toContain("اتصال");
    expect(html).toContain("واتساب");
    expect(html).toContain("Instagram");
    expect(html).toContain("Facebook");
    expect(html).toContain("TikTok");
    expect(html).toContain("البريد الإلكتروني");
    expect(html).toContain("مكان العمل");
    expect(html).not.toContain("Google Maps");
  });
});
