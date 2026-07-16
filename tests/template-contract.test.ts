import { describe, expect, it } from "vitest";
import {
  PLATFORM_TEMPLATE_SECTION_TYPES,
  formatTemplatePrice,
  normalizeContactHref,
  normalizeTemplateSections,
  resolveHeroSettings,
} from "@/modules/themes/template-contract";

describe("unified template contract", () => {
  it("defines one exact capability set", () => {
    expect(PLATFORM_TEMPLATE_SECTION_TYPES).toEqual(["hero", "gallery", "packages", "extras", "contact"]);
  });

  it("normalizes missing sections while preserving persisted order, visibility and settings", () => {
    const normalized = normalizeTemplateSections([
      { type: "contact", title: "تواصل", sortOrder: 0, isVisible: false, data: { description: "اختر وسيلة التواصل", settings: { eyebrow: "ابدأ الآن", layout: "stack" } } },
      { type: "hero", title: "واجهة", sortOrder: 4, isVisible: true, data: {} },
    ]);
    expect(normalized.orderedSections.map((section) => section.type)).toEqual(["contact", "gallery", "packages", "extras", "hero"]);
    expect(normalized.sections.contact).toMatchObject({ isVisible: false, settings: { eyebrow: "ابدأ الآن", layout: "stack" } });
  });

  it("provides safe Hero defaults and accepts dashboard overrides", () => {
    expect(resolveHeroSettings({})).toEqual({ overlay: "medium", position: "center", height: "screen", cta: { label: "الأسعار والباكدج", target: "packages" }, eyebrow: "تصوير احترافي" });
    expect(resolveHeroSettings({ overlay: "strong", position: "top", height: "tall", cta: { label: "تواصل", target: "contact" }, settings: { eyebrow: "قصص" } })).toEqual({ overlay: "strong", position: "top", height: "tall", cta: { label: "تواصل", target: "contact" }, eyebrow: "قصص" });
  });

  it("shows zero prices as price on request", () => {
    expect(formatTemplatePrice(0, "EGP")).toBe("السعر عند الطلب");
  });

  it("normalizes every supported contact channel", () => {
    expect(normalizeContactHref("phone", "+20 100 000 0000")).toBe("tel:+201000000000");
    expect(normalizeContactHref("whatsapp", "+20 100 000 0000")).toBe("https://wa.me/201000000000");
    expect(normalizeContactHref("instagram", "@frameid")).toBe("https://instagram.com/frameid");
    expect(normalizeContactHref("facebook", "frameid")).toBe("https://facebook.com/frameid");
    expect(normalizeContactHref("tiktok", "@frameid")).toBe("https://tiktok.com/@frameid");
    expect(normalizeContactHref("email", "hello@example.com")).toBe("mailto:hello@example.com");
  });
});
