import {
  parsePlatformPageDocument,
  type PlatformPageDocument,
} from "@/modules/platform-pages/page-document";

type HomePageSource = {
  hero: Record<string, unknown>;
  templateSection: Record<string, unknown>;
  benefits: Array<Record<string, unknown>>;
  howItWorks: Array<Record<string, unknown>>;
  trustSection: Record<string, unknown>;
  finalCta: Record<string, unknown>;
  mobileStickyCta: Record<string, unknown>;
  photographerTypes?: Array<Record<string, unknown>>;
};

type FaqSource = {
  sectionTitle: string;
  items: Array<Record<string, unknown>>;
};

export function buildHomePageDocument(
  homepage: HomePageSource,
  faq: FaqSource,
): PlatformPageDocument {
  return parsePlatformPageDocument({
    pageKey: "home",
    schemaVersion: 1,
    sections: [
      {
        id: "home-hero",
        type: "home.hero",
        status: "visible",
        content: homepage.hero,
      },
      {
        id: "home-templates",
        type: "home.templates",
        status: "visible",
        content: homepage.templateSection,
      },
      {
        id: "home-benefits",
        type: "home.benefits",
        status: "visible",
        content: {
          title: "كل التفاصيل في مكانها",
          subtitle: "معلومات واضحة لعميلك، ووقت أقل في تكرار نفس الإجابات.",
          items: homepage.benefits,
        },
      },
      {
        id: "home-journey",
        type: "home.journey",
        status: "visible",
        content: {
          title: "ابدأ بخطوات واضحة",
          subtitle: "اختر تصميمك، أضف تفاصيلك، ثم شارك رابطك.",
          items: homepage.howItWorks,
        },
      },
      {
        id: "home-faq",
        type: "home.faq",
        status: "visible",
        content: {
          ...homepage.trustSection,
          sectionTitle: faq.sectionTitle,
          items: faq.items,
        },
      },
      {
        id: "home-final-cta",
        type: "home.final-cta",
        status: "visible",
        content: {
          ...homepage.finalCta,
          mobile: homepage.mobileStickyCta,
        },
      },
    ],
  });
}
