import type { TemplateStarterContent } from "@/modules/themes/template-starter-content";

export const TEMPLATE_STARTER_DEFAULTS_CODE = "__starter-content-defaults__";

export type TemplateStarterCommonTexts = {
  galleryTitle?: string | null;
  galleryDescription?: string | null;
  packagesTitle?: string | null;
  packagesDescription?: string | null;
  extrasTitle?: string | null;
  extrasDescription?: string | null;
  contactTitle?: string | null;
  contactCallToAction?: string | null;
};

export type TemplateStarterSeoDefaults = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  robotsIndex?: boolean;
};

export type TemplateStarterSharedDefaults = {
  photographerName: string;
  studioName: string;
  description: string;
  heroImageUrl?: string | null;
  galleryImages?: TemplateStarterContent["gallery"]["images"] | null;
  packages?: TemplateStarterContent["packages"] | null;
  extras?: TemplateStarterContent["extras"] | null;
  seo?: TemplateStarterSeoDefaults | null;
  commonTexts?: TemplateStarterCommonTexts | null;
};

export type TemplateStarterSharedOverrides = Partial<Pick<
  TemplateStarterSharedDefaults,
  "photographerName" | "studioName" | "description" | "heroImageUrl"
>>;

export const OFFICIAL_TEMPLATE_STARTER_DEFAULTS: TemplateStarterSharedDefaults = {
  photographerName: "Kareem Magdy",
  studioName: "Photography",
  description: "Wedding Photographer\nمصور زفاف",
  heroImageUrl: null,
  galleryImages: null,
  packages: null,
  extras: null,
  seo: null,
  commonTexts: null,
};

export function normalizeTemplateStarterSharedDefaults(value: unknown): TemplateStarterSharedDefaults {
  const source = isRecord(value) ? value : {};
  return {
    photographerName: readText(source.photographerName, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.photographerName),
    studioName: readText(source.studioName, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.studioName),
    description: readText(source.description, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.description),
    heroImageUrl: readOptionalText(source.heroImageUrl),
    galleryImages: readRecordArray(source.galleryImages) as TemplateStarterContent["gallery"]["images"] | null,
    packages: readRecordArray(source.packages) as TemplateStarterContent["packages"] | null,
    extras: readRecordArray(source.extras) as TemplateStarterContent["extras"] | null,
    seo: isRecord(source.seo) ? {
      title: readOptionalText(source.seo.title),
      description: readOptionalText(source.seo.description),
      canonicalUrl: readOptionalText(source.seo.canonicalUrl),
      robotsIndex: typeof source.seo.robotsIndex === "boolean" ? source.seo.robotsIndex : undefined,
    } : null,
    commonTexts: isRecord(source.commonTexts) ? {
      galleryTitle: readOptionalText(source.commonTexts.galleryTitle),
      galleryDescription: readOptionalText(source.commonTexts.galleryDescription),
      packagesTitle: readOptionalText(source.commonTexts.packagesTitle),
      packagesDescription: readOptionalText(source.commonTexts.packagesDescription),
      extrasTitle: readOptionalText(source.commonTexts.extrasTitle),
      extrasDescription: readOptionalText(source.commonTexts.extrasDescription),
      contactTitle: readOptionalText(source.commonTexts.contactTitle),
      contactCallToAction: readOptionalText(source.commonTexts.contactCallToAction),
    } : null,
  };
}

export function readTemplateStarterSharedOverrides(value: unknown): TemplateStarterSharedOverrides {
  if (!isRecord(value) || !isRecord(value.starterContentOverride)) return {};
  const override = value.starterContentOverride;
  return compact({
    photographerName: readOptionalText(override.photographerName) ?? undefined,
    studioName: readOptionalText(override.studioName) ?? undefined,
    description: readOptionalText(override.description) ?? undefined,
    heroImageUrl: readOptionalText(override.heroImageUrl) ?? undefined,
  });
}

export function applyTemplateStarterSharedDefaults(
  content: TemplateStarterContent,
  sharedDefaults: TemplateStarterSharedDefaults = OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
  overrides: TemplateStarterSharedOverrides = {},
): TemplateStarterContent {
  const resolved = { ...sharedDefaults, ...compact(overrides) };
  const next = structuredClone(content);

  next.site.title = resolved.photographerName;
  next.site.description = resolved.description;
  next.sections.hero.headline = resolved.photographerName;
  next.sections.hero.subheadline = resolved.description;
  if (resolved.heroImageUrl) next.sections.hero.imageUrl = resolved.heroImageUrl;
  next.contact.studioName = resolved.studioName;
  next.contact.bio = resolved.description;
  next.contact.longDescription = resolved.description;

  if (resolved.galleryImages?.length) next.gallery.images = structuredClone(resolved.galleryImages);
  if (resolved.packages?.length) next.packages = structuredClone(resolved.packages);
  if (resolved.extras?.length) next.extras = structuredClone(resolved.extras);

  const texts = resolved.commonTexts;
  if (texts?.galleryTitle) next.sections.gallery.title = texts.galleryTitle;
  if (texts?.galleryDescription) next.sections.gallery.description = texts.galleryDescription;
  if (texts?.packagesTitle) next.sections.packages.title = texts.packagesTitle;
  if (texts?.packagesDescription) next.sections.packages.description = texts.packagesDescription;
  if (texts?.extrasTitle) next.sections.extras.title = texts.extrasTitle;
  if (texts?.extrasDescription) next.sections.extras.description = texts.extrasDescription;
  if (texts?.contactTitle) next.sections.contact.title = texts.contactTitle;
  if (texts?.contactCallToAction) next.sections.contact.callToAction = texts.contactCallToAction;

  next.seo.title = resolved.seo?.title || resolved.photographerName;
  next.seo.description = resolved.seo?.description || resolved.description;
  if (resolved.seo?.canonicalUrl !== undefined) next.seo.canonicalUrl = resolved.seo.canonicalUrl;
  if (resolved.seo?.robotsIndex !== undefined) next.seo.robotsIndex = resolved.seo.robotsIndex;
  next.seo.structuredData.name = resolved.photographerName;
  next.seo.structuredData.description = next.seo.description;

  return next;
}

export function serializeTemplateStarterDefaults(defaults: TemplateStarterSharedDefaults) {
  return { sharedDefaults: normalizeTemplateStarterSharedDefaults(defaults) };
}

function compact(value: TemplateStarterSharedOverrides): TemplateStarterSharedOverrides {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ""),
  ) as TemplateStarterSharedOverrides;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecordArray(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) return null;
  const records = value.filter(isRecord);
  return records.length ? records : null;
}

function readText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
