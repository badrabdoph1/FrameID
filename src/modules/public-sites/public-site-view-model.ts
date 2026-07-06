import type { Metadata } from "next";

export type PublicSiteRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "EXPIRED" | "SUSPENDED" | string;
  isPublished: boolean;
  theme: {
    code: string;
    name: string;
  };
  tenant: {
    displayName: string;
  };
  sections: Array<{
    type: string;
    title: string | null;
    sortOrder: number;
    data: Record<string, unknown>;
  }>;
  packages: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    priceAmount: number;
    currency: string;
    features: unknown;
    imageUrl: string | null;
    isHighlighted: boolean;
  }>;
  extras: Array<{
    id: string;
    name: string;
    priceAmount: number;
    currency: string;
    iconKey: string | null;
  }>;
  gallery: Array<{
    id: string;
    url: string;
    alt: string | null;
    caption: string | null;
  }>;
  seoSettings: {
    title: string;
    description: string | null;
    canonicalUrl: string | null;
    robotsIndex: boolean;
    structuredDataOverrides: unknown;
    ogImageUrl: string | null;
  } | null;
};

export type PublicSiteViewModel = {
  siteId: string;
  themeCode: string;
  publicUrl: string;
  metadata: Metadata;
  structuredData: Record<string, unknown>;
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
  };
  contact: {
    callToAction: string;
  };
  packages: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    price: string;
    features: string[];
    imageUrl: string | null;
    isHighlighted: boolean;
  }>;
  extras: Array<{
    id: string;
    name: string;
    price: string;
    iconKey: string | null;
  }>;
  gallery: Array<{
    id: string;
    url: string;
    alt: string;
    caption: string | null;
  }>;
};

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85";

export function createPublicSiteViewModel({
  site,
  platformBaseUrl
}: {
  site: PublicSiteRecord;
  platformBaseUrl: string;
}): PublicSiteViewModel {
  const publicUrl = `${platformBaseUrl.replace(/\/$/u, "")}/p/${site.slug}`;
  const heroSection = findSection(site, "hero");
  const contactSection = findSection(site, "contact");
  const metadataTitle = site.seoSettings?.title ?? site.title;
  const metadataDescription =
    site.seoSettings?.description ??
    site.description ??
    `موقع ${site.tenant.displayName} على FrameID.`;
  const canonical = site.seoSettings?.canonicalUrl ?? publicUrl;

  return {
    siteId: site.id,
    themeCode: site.theme.code,
    publicUrl,
    metadata: {
      title: metadataTitle,
      description: metadataDescription,
      alternates: {
        canonical
      },
      robots: {
        index: site.seoSettings?.robotsIndex ?? site.isPublished,
        follow: site.seoSettings?.robotsIndex ?? site.isPublished
      },
      openGraph: {
        title: metadataTitle,
        description: metadataDescription,
        url: canonical,
        images: site.seoSettings?.ogImageUrl
          ? [{ url: site.seoSettings.ogImageUrl }]
          : undefined
      }
    },
    structuredData:
      (site.seoSettings?.structuredDataOverrides as Record<string, unknown> | null) ??
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: site.tenant.displayName,
        url: publicUrl,
        description: metadataDescription
      },
    hero: {
      headline: readString(heroSection?.data.headline, site.title),
      subheadline: readString(
        heroSection?.data.subheadline,
        site.description ?? `تصوير احترافي مع ${site.tenant.displayName}.`
      ),
      imageUrl: readString(heroSection?.data.imageUrl, FALLBACK_HERO_IMAGE)
    },
    contact: {
      callToAction: readString(
        contactSection?.data.callToAction,
        "احجز جلستك الآن"
      )
    },
    packages: site.packages.map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.subtitle,
      price: formatMoney(item.priceAmount, item.currency),
      features: readStringList(item.features),
      imageUrl: item.imageUrl,
      isHighlighted: item.isHighlighted
    })),
    extras: site.extras.map((item) => ({
      id: item.id,
      name: item.name,
      price: formatMoney(item.priceAmount, item.currency),
      iconKey: item.iconKey
    })),
    gallery: site.gallery.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt ?? item.caption ?? site.title,
      caption: item.caption
    }))
  };
}

function findSection(site: PublicSiteRecord, type: string) {
  return [...site.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((section) => section.type === type);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim())
  );
}

function formatMoney(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)} ${currency}`;
}
