import "server-only";

import { getContent } from "@/lib/content";
import { buildHomePageDocument } from "@/modules/platform-pages/home-page-document";
import { parseHomeSectionContent, type HomeHeroContent } from "@/modules/platform-pages/home-page-content";
import { loadPublishedPlatformPageState } from "@/modules/platform-pages/platform-page-runtime";

export async function loadPublishedHomePageState() {
  const homepage = getContent("marketing/homepage");
  const faq = getContent("marketing/faq");
  return loadPublishedPlatformPageState(
    "home",
    buildHomePageDocument(homepage, faq),
    `legacy-${homepage._version}-${faq._version}`,
  );
}

export function getHomeHeroContent(document: Awaited<ReturnType<typeof loadPublishedHomePageState>>["document"]): HomeHeroContent {
  const heroSection = document.sections.find((section) => section.type === "home.hero");
  if (!heroSection) throw new Error("الصفحة الرئيسية لا تحتوي على قسم رئيسي");
  const parsed = parseHomeSectionContent(heroSection);
  if (parsed.type !== "home.hero") throw new Error("تعذر قراءة القسم الرئيسي");
  return parsed.content;
}

export function getHomeHeroImageUrl(hero: HomeHeroContent): string {
  return typeof hero.heroImage === "string" ? hero.heroImage : hero.heroImage.url;
}
