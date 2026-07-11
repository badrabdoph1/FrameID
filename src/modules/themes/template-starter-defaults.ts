import type { TemplateStarterContent } from "@/modules/themes/template-starter-content";

export const TEMPLATE_STARTER_DEFAULTS_CODE = "__starter-content-defaults__";

export type TemplateStarterSharedDefaults = {
  photographerName: string;
  studioName: string;
  description: string;
  heroImageUrl?: string | null;
};

export type TemplateStarterSharedOverrides = Partial<TemplateStarterSharedDefaults>;

export const OFFICIAL_TEMPLATE_STARTER_DEFAULTS: TemplateStarterSharedDefaults = {
  photographerName: "Kareem Magdy",
  studioName: "Photography",
  description: "Wedding Photographer\nمصور زفاف",
  heroImageUrl: null,
};

export function normalizeTemplateStarterSharedDefaults(value: unknown): TemplateStarterSharedDefaults {
  const source = isRecord(value) ? value : {};
  return {
    photographerName: readText(source.photographerName, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.photographerName),
    studioName: readText(source.studioName, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.studioName),
    description: readText(source.description, OFFICIAL_TEMPLATE_STARTER_DEFAULTS.description),
    heroImageUrl: readOptionalText(source.heroImageUrl),
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
  next.seo.title = resolved.photographerName;
  next.seo.description = resolved.description;
  next.seo.structuredData.name = resolved.photographerName;
  next.seo.structuredData.description = resolved.description;

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

function readText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
