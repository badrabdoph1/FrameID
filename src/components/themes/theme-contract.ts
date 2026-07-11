import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

export const REQUIRED_THEME_SECTION_IDS = ["home", "gallery", "packages", "extras", "contact"] as const;

export const THEME_DATA_CONTRACT = {
  displayName: "Use the customer's studio/contact name first, then metadata title, then hero headline.",
  hero: "Use site.hero.headline and site.hero.subheadline for the main hero title and description.",
  imagery: "Use customer gallery/package images only for theme visuals. Do not introduce hardcoded decorative photography in theme components.",
  packages: "Render site.packages only, preserving name, subtitle, price, features, imageUrl and isHighlighted.",
  extras: "Render site.extras only, preserving name, price and iconKey.",
  booking: "Use contact.callToAction, whatsapp/email and the selected package/extras to build the booking CTA.",
  sections: REQUIRED_THEME_SECTION_IDS
} as const;

export function getThemeDisplayName(site: PublicSiteViewModel) {
  const metadataTitle = typeof site.metadata.title === "string" ? site.metadata.title : "";
  const normalizedTitle = metadataTitle.split(/[—|]/u)[0]?.trim() ?? "";

  return (
    cleanString(site.contact.studioName) ??
    cleanString(normalizedTitle) ??
    cleanString(site.hero.headline) ??
    "استوديو تصوير"
  );
}

export function getThemeMobileCaption(site: PublicSiteViewModel, displayName: string) {
  const metadataDescription = typeof site.metadata.description === "string" ? site.metadata.description : "";
  const candidates = [site.hero.headline, metadataDescription, site.hero.subheadline, site.contact.bio];

  return candidates.find((item) => {
    const value = cleanString(item);
    return Boolean(value && value !== displayName);
  })?.trim() ?? "معرض تصوير";
}

export function getThemeHeroImage(site: PublicSiteViewModel) {
  return site.gallery[0] ?? null;
}

export function getThemeFeaturedImage(site: PublicSiteViewModel) {
  return site.gallery[1]?.url ?? site.gallery[0]?.url ?? null;
}

export function getThemeSectionCopy(
  site: PublicSiteViewModel,
  type: "hero" | "gallery" | "packages" | "extras" | "contact",
  fallback: { title: string; description?: string | null },
) {
  const section = site.sections[type];

  return {
    title: cleanString(section?.title) ?? fallback.title,
    description: cleanString(section?.description) ?? fallback.description ?? null,
  };
}

export function isThemeSectionVisible(
  site: PublicSiteViewModel,
  type: "hero" | "gallery" | "packages" | "extras" | "contact",
) {
  return site.sections[type]?.isVisible ?? true;
}

export function createThemeBookingHref({
  site,
  selectedPackage,
  selectedExtras,
  total
}: {
  site: PublicSiteViewModel;
  selectedPackage: PublicSiteViewModel["packages"][number] | undefined;
  selectedExtras: PublicSiteViewModel["extras"];
  total: number;
}) {
  if (!selectedPackage) return "#packages";

  const message = [
    `مرحباً، أريد تأكيد الحجز في موقع ${site.hero.headline}.`,
    "",
    `الباقة: ${selectedPackage.name} (${selectedPackage.price})`,
    selectedExtras.length
      ? `الإضافات: ${selectedExtras.map((item) => `${item.name} (${item.price})`).join("، ")}`
      : "الإضافات: لا يوجد",
    `الإجمالي التقريبي: ${formatThemeTotal(total, selectedPackage.currency)}`
  ].join("\n");

  if (site.contact.whatsapp) {
    return `https://wa.me/${site.contact.whatsapp.replace(/[^\d]/gu, "")}?text=${encodeURIComponent(message)}`;
  }

  if (site.contact.email) {
    return `mailto:${site.contact.email}?subject=${encodeURIComponent(`حجز ${selectedPackage.name}`)}&body=${encodeURIComponent(message)}`;
  }

  return `mailto:?subject=${encodeURIComponent(site.hero.headline)}&body=${encodeURIComponent(message)}`;
}

export function formatThemeTotal(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} ${formatCurrencyLabel(currency)}`;
}

export function normalizeThemeSocialUrl(value: string, provider: "instagram" | "facebook") {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return provider === "instagram" ? `https://instagram.com/${value.replace(/^@/u, "")}` : `https://facebook.com/${value}`;
}

function formatCurrencyLabel(currency: string): string {
  return currency === "EGP" ? "جنيه" : currency;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
