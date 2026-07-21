import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TemplateStarterContent } from "@/modules/themes/template-starter-content";

const UNIFIED_CONTENT_FILE = join(process.cwd(), "content", "templates", "unified-content.json");

type UnifiedContentData = Record<string, unknown>;

function readUnifiedContentData(): UnifiedContentData | null {
  try {
    const raw = readFileSync(UNIFIED_CONTENT_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return (parsed.data as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

function readText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function readOptionalText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function readInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function readBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

/**
 * Applies unified-content.json data onto a template's starter content.
 * This overwrites: site info, hero, packages, extras, gallery, contact.
 */
export function applyUnifiedContent(content: TemplateStarterContent): TemplateStarterContent {
  const data = readUnifiedContentData();
  if (!data) return content;

  const next = structuredClone(content);

  // Site info
  next.site.title = readText(data.photographerName, next.site.title);
  next.site.description = readText(data.description, next.site.description);

  // Hero section
  next.sections.hero.headline = readText(data.photographerName, next.sections.hero.headline);
  next.sections.hero.subheadline = readText(data.description, next.sections.hero.subheadline);
  const heroImage = readOptionalText(data.heroImageUrl);
  if (heroImage) next.sections.hero.imageUrl = heroImage;

  // Hero CTA and eyebrow
  const ctaLabel = readOptionalText(data.heroCtaLabel);
  if (ctaLabel) next.sections.hero.cta.label = ctaLabel;
  const eyebrow = readOptionalText(data.heroEyebrow);
  if (eyebrow) next.sections.hero.settings.eyebrow = eyebrow;

  // SEO
  next.seo.title = readText(data.photographerName, next.seo.title);
  next.seo.description = readText(data.description, next.seo.description);
  if (next.seo.structuredData && typeof next.seo.structuredData === "object") {
    const sd = next.seo.structuredData as Record<string, unknown>;
    sd.name = readText(data.photographerName, String(sd.name ?? ""));
    sd.description = readText(data.description, String(sd.description ?? ""));
  }

  // Packages section title/description
  next.sections.packages.title = readText(data.packagesTitle, next.sections.packages.title);
  next.sections.packages.description = readText(data.packagesDescription, next.sections.packages.description);

  // Packages items
  if (Array.isArray(data.packages) && data.packages.length > 0) {
    next.packages = data.packages.map((pkg: unknown) => {
      const p = (pkg ?? {}) as Record<string, unknown>;
      return {
        id: String(p.id ?? ""),
        name: readText(p.name, ""),
        subtitle: readText(p.subtitle, ""),
        priceAmount: readInt(p.priceAmount, 0),
        currency: String(p.currency ?? "EGP"),
        features: Array.isArray(p.features)
          ? p.features.map((f: unknown) => readText(f, ""))
          : [],
        imageUrl: String(p.imageUrl ?? ""),
        isHighlighted: readBool(p.isHighlighted, false),
        sortOrder: readInt(p.sortOrder, 0),
      };
    }).filter((pkg) => pkg.name && pkg.features.length > 0);
  }

  // Extras section title/description
  next.sections.extras.title = readText(data.extrasTitle, next.sections.extras.title);
  next.sections.extras.description = readText(data.extrasDescription, next.sections.extras.description);

  // Extras items
  if (Array.isArray(data.extras) && data.extras.length > 0) {
    next.extras = data.extras.map((extra: unknown) => {
      const e = (extra ?? {}) as Record<string, unknown>;
      return {
        id: String(e.id ?? ""),
        name: readText(e.name, ""),
        description: readText(e.description, ""),
        priceAmount: readInt(e.priceAmount, 0),
        currency: String(e.currency ?? "EGP"),
        iconKey: String(e.iconKey ?? "sparkles"),
        sortOrder: readInt(e.sortOrder, 0),
      };
    }).filter((extra) => extra.name);
  }

  // Gallery section title/description
  next.sections.gallery.title = readText(data.galleryTitle, next.sections.gallery.title);
  next.sections.gallery.description = readText(data.galleryDescription, next.sections.gallery.description);

  // Gallery images
  if (Array.isArray(data.gallery) && data.gallery.length > 0) {
    next.gallery.album = {
      title: readText(data.galleryTitle, next.gallery.album.title),
      description: readText(data.galleryDescription, next.gallery.album.description),
      sortOrder: next.gallery.album.sortOrder,
    };
    next.gallery.images = data.gallery.map((img: unknown) => {
      const g = (img ?? {}) as Record<string, unknown>;
      return {
        id: String(g.id ?? ""),
        url: String(g.url ?? ""),
        alt: readText(g.alt, ""),
        caption: readText(g.caption, ""),
        sortOrder: readInt(g.sortOrder, 0),
        isFeatured: readBool(g.isFeatured, false),
      };
    }).filter((img) => img.url);
  }

  // Contact section
  next.sections.contact.callToAction = readText(data.heroCtaLabel, next.sections.contact.callToAction);

  // Contact info
  next.contact.studioName = readOptionalText(data.studioName) ?? next.contact.studioName;
  next.contact.bio = readText(data.description, next.contact.bio ?? "");
  next.contact.longDescription = readText(data.description, next.contact.longDescription ?? "");
  next.contact.phone = readOptionalText(data.contactPhone);
  next.contact.whatsapp = readOptionalText(data.contactWhatsapp);
  next.contact.email = readOptionalText(data.contactEmail);
  next.contact.instagram = readOptionalText(data.contactInstagram);
  next.contact.facebook = readOptionalText(data.contactFacebook);
  next.contact.tiktok = readOptionalText(data.contactTiktok);
  next.contact.workLocation = readText(data.workLocation, next.contact.workLocation);

  return next;
}
