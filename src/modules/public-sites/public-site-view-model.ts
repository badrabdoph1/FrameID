import type { Metadata } from "next";

import {
  formatTemplatePrice,
  normalizeTemplateSections,
  resolveHeroSettings,
  type NormalizedTemplateSection,
} from "@/modules/themes/template-contract";

export type PublicSiteRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "EXPIRED" | "SUSPENDED" | string;
  isPublished: boolean;
  theme: { code: string; name: string };
  tenant: { displayName: string };
  contactProfile: {
    studioName?: string | null;
    bio?: string | null;
    longDescription?: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok?: string | null;
    workLocation?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
  } | null;
  sections: Array<{ type: string; title: string | null; sortOrder: number; isVisible?: boolean; data: Record<string, unknown> }>;
  packages: Array<{ id: string; name: string; subtitle: string | null; priceAmount: number; currency: string; features: unknown; imageUrl: string | null; isHighlighted: boolean }>;
  extras: Array<{ id: string; name: string; description?: string | null; priceAmount: number; currency: string; iconKey: string | null }>;
  gallery: Array<{ id: string; url: string; alt: string | null; caption: string | null }>;
  seoSettings: { title: string; description: string | null; canonicalUrl: string | null; robotsIndex: boolean; structuredDataOverrides: unknown; ogImageUrl: string | null } | null;
};

export type PublicSiteViewModel = {
  siteId: string;
  themeCode: string;
  publicUrl: string;
  metadata: Metadata;
  structuredData: Record<string, unknown>;
  sections: Record<string, { title: string; description: string | null; sortOrder: number; isVisible: boolean; settings: Record<string, string | number> }>;
  orderedSections: NormalizedTemplateSection[];
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
    overlay: "none" | "soft" | "medium" | "strong";
    position: "center" | "top" | "bottom" | "left" | "right";
    height: "compact" | "screen" | "tall";
    cta: { label: string; target: "packages" | "gallery" | "contact" | "whatsapp" };
    eyebrow: string;
  };
  contact: {
    studioName: string | null;
    bio: string | null;
    longDescription: string | null;
    callToAction: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    workLocation: string;
  };
  packages: Array<{ id: string; name: string; subtitle: string | null; price: string; priceAmount: number; currency: string; features: string[]; imageUrl: string | null; isHighlighted: boolean }>;
  extras: Array<{ id: string; name: string; description?: string | null; price: string; priceAmount: number; currency: string; iconKey: string | null }>;
  gallery: Array<{ id: string; url: string; alt: string; caption: string | null }>;
};

const FALLBACK_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85";

export function createPublicSiteViewModel({ site, platformBaseUrl, platformSocialImageUrl = "/frameid-social-preview.png" }: { site: PublicSiteRecord; platformBaseUrl: string; platformSocialImageUrl?: string }): PublicSiteViewModel {
  const publicUrl = `${platformBaseUrl.replace(/\/$/u, "")}/p/${site.slug}`;
  const heroSection = findSection(site, "hero");
  const contactSection = findSection(site, "contact");
  const normalizedSections = normalizeTemplateSections(site.sections);
  const heroSettings = resolveHeroSettings(heroSection?.data ?? {});
  const studioName = readNullableString(site.contactProfile?.studioName);
  const photographerName = readString(site.title, site.tenant.displayName);
  const metadataTitle = studioName ?? photographerName;
  const metadataDescription = firstText(site.contactProfile?.bio, site.contactProfile?.longDescription, site.description, site.seoSettings?.description, `موقع ${photographerName} للتصوير.`);
  const canonical = site.seoSettings?.canonicalUrl ?? publicUrl;
  const heroImageUrl = firstText(site.contactProfile?.coverUrl, heroSection?.data.imageUrl, site.gallery[0]?.url, FALLBACK_HERO_IMAGE);
  const socialImageUrl = firstText(site.contactProfile?.avatarUrl, site.contactProfile?.coverUrl, heroSection?.data.imageUrl, platformSocialImageUrl);
  const shouldIndex = site.seoSettings?.robotsIndex ?? site.isPublished;

  return {
    siteId: site.id,
    themeCode: site.theme.code,
    publicUrl,
    metadata: {
      title: metadataTitle,
      description: metadataDescription,
      alternates: { canonical },
      robots: { index: shouldIndex, follow: shouldIndex },
      openGraph: { type: "website", title: metadataTitle, description: metadataDescription, url: canonical, images: [{ url: socialImageUrl, alt: metadataTitle }] },
      twitter: { card: "summary_large_image", title: metadataTitle, description: metadataDescription, images: [socialImageUrl] },
    },
    structuredData: (site.seoSettings?.structuredDataOverrides as Record<string, unknown> | null) ?? { "@context": "https://schema.org", "@type": "LocalBusiness", name: metadataTitle, url: publicUrl, description: metadataDescription },
    sections: normalizedSections.sections,
    orderedSections: normalizedSections.orderedSections,
    hero: {
      headline: readString(heroSection?.data.headline, site.title),
      subheadline: readString(heroSection?.data.subheadline, site.description ?? `تصوير احترافي مع ${site.tenant.displayName}.`),
      imageUrl: heroImageUrl,
      ...heroSettings,
    },
    contact: {
      studioName: site.contactProfile?.studioName ?? null,
      bio: site.contactProfile?.bio ?? null,
      longDescription: site.contactProfile?.longDescription ?? null,
      callToAction: readString(contactSection?.data.callToAction, "احجز جلستك الآن"),
      phone: site.contactProfile?.phone ?? null,
      whatsapp: site.contactProfile?.whatsapp ?? null,
      email: site.contactProfile?.email ?? null,
      instagram: site.contactProfile?.instagram ?? null,
      facebook: site.contactProfile?.facebook ?? null,
      tiktok: site.contactProfile?.tiktok ?? null,
      workLocation: readString(site.contactProfile?.workLocation, "فريلانسر"),
    },
    packages: site.packages.map((item) => ({ id: item.id, name: item.name, subtitle: item.subtitle, price: formatTemplatePrice(item.priceAmount, item.currency), priceAmount: item.priceAmount, currency: item.currency, features: readStringList(item.features), imageUrl: item.imageUrl, isHighlighted: item.isHighlighted })),
    extras: site.extras.map((item) => ({ id: item.id, name: item.name, description: item.description ?? null, price: formatTemplatePrice(item.priceAmount, item.currency), priceAmount: item.priceAmount, currency: item.currency, iconKey: item.iconKey })),
    gallery: site.gallery.map((item) => ({ id: item.id, url: item.url, alt: item.alt ?? item.caption ?? site.title, caption: item.caption })),
  };
}

function findSection(site: PublicSiteRecord, type: string) { return [...site.sections].sort((a, b) => a.sortOrder - b.sortOrder).find((section) => section.type === type); }
function firstText(...values: unknown[]): string { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; }
function readString(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function readNullableString(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function readStringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : []; }
