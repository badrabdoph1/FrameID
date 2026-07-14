import { describe, expect, it } from "vitest";

import {
  PLATFORM_PAGE_DEFINITIONS,
  getPlatformPageDefinition,
} from "@/modules/platform-pages/page-catalog";
import { buildHomePageDocument } from "@/modules/platform-pages/home-page-document";

const homepage = {
  hero: {
    badge: "منصة مواقع للمصورين",
    headline: "كل صفحاتك وتفاصيلك",
    headlineHighlight: "في رابط واحد",
    subheadline: "اعرض شغلك بصورة واضحة.",
    heroImage: "https://example.com/hero.jpg",
    cta: { label: "ابدأ مجانًا", href: "/signup" },
    secondaryCta: { label: "شاهد مثالًا", href: "/templates" },
    trustPoints: [{ text: "تجربة مجانية" }],
  },
  templateSection: { badge: "شاهد", title: "اختر تصميمك", subtitle: "تصميمات جاهزة" },
  benefits: [{ title: "واضح", body: "كل التفاصيل في مكان واحد" }],
  howItWorks: [{ step: 1, title: "اختر", body: "اختر القالب", href: "/templates" }],
  trustSection: { badge: "الأسئلة", title: "إجابات واضحة", message: "" },
  finalCta: {
    title: "ابدأ الآن",
    subtext: "أنشئ موقعك",
    cta: { label: "ابدأ", href: "/signup" },
  },
  mobileStickyCta: { label: "موقعك", buttonText: "ابدأ", href: "/signup" },
  photographerTypes: [{ label: "مصور زفاف" }],
};

const faq = {
  sectionTitle: "الأسئلة الشائعة",
  items: [{ question: "هل أحتاج مبرمجًا؟", answer: "لا." }],
};

describe("platform page catalog", () => {
  it("gives every workspace one stable key and route", () => {
    expect(new Set(PLATFORM_PAGE_DEFINITIONS.map((page) => page.key)).size).toBe(
      PLATFORM_PAGE_DEFINITIONS.length,
    );
    expect(new Set(PLATFORM_PAGE_DEFINITIONS.map((page) => page.route)).size).toBe(
      PLATFORM_PAGE_DEFINITIONS.length,
    );
    expect(getPlatformPageDefinition("home")).toMatchObject({ route: "/", kind: "EDITORIAL" });
    expect(getPlatformPageDefinition("dashboard")).toMatchObject({
      route: "/dashboard",
      kind: "FUNCTIONAL",
    });
  });

  it("builds home as one canonical ordered document", () => {
    const document = buildHomePageDocument(homepage, faq);

    expect(document.pageKey).toBe("home");
    expect(document.sections.map((section) => section.id)).toEqual([
      "home-hero",
      "home-templates",
      "home-benefits",
      "home-journey",
      "home-faq",
      "home-final-cta",
    ]);
    expect(document.sections.every((section) => section.status === "visible")).toBe(true);
    expect(document.sections[4].content).toMatchObject({ items: faq.items });
  });
});
