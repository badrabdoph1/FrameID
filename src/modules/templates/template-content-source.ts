import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import {
  getTemplateByCode,
  themeRegistry,
  type TemplateSummary,
  type ThemeDefinition,
} from "@/modules/themes/theme-registry";
import {
  personalizeTemplateStarterContent,
  type TemplateRegistrationIdentity,
  type TemplateStarterContent,
} from "@/modules/themes/template-starter-content";
import {
  applyTemplateStarterSharedDefaults,
  OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
  type TemplateStarterSharedDefaults,
  type TemplateStarterSharedOverrides,
} from "@/modules/themes/template-starter-defaults";
import {
  formatTemplatePrice,
  normalizeTemplateSections,
  resolveHeroSettings,
  type TemplateSectionType,
} from "@/modules/themes/template-contract";

export type TemplateContentSource = {
  code: string;
  version: string;
  themeCode: string;
  template: TemplateSummary;
  theme: ThemeDefinition;
  content: TemplateStarterContent;
};

export type TemplateContentSourceOptions = {
  sharedDefaults?: TemplateStarterSharedDefaults;
  templateOverride?: TemplateStarterSharedOverrides;
};

export type ProvisionedTemplateSection = {
  type: TemplateSectionType;
  title: string;
  sortOrder: number;
  isVisible: boolean;
  data: Record<string, unknown>;
};

export type ProvisionedTemplatePayload = {
  templateCode: string;
  templateVersion: string;
  themeCode: string;
  themeVersion: string;
  themeConfig: Record<string, unknown>;
  site: { title: string; description: string };
  sections: ProvisionedTemplateSection[];
  contact: TemplateStarterContent["contact"] & { callToAction: string };
  packages: Array<TemplateStarterContent["packages"][number] & { price: string }>;
  extras: Array<TemplateStarterContent["extras"][number] & { price: string }>;
  gallery: {
    album: TemplateStarterContent["gallery"]["album"];
    images: TemplateStarterContent["gallery"]["images"];
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string | null;
    robotsIndex: boolean;
    structuredDataOverrides: Record<string, unknown>;
  };
};

const DEFAULT_TEMPLATE_CODE = "noir-gold";

export function getDefaultTemplateContentSourceCode() {
  return DEFAULT_TEMPLATE_CODE;
}

export function getTemplateContentSource(
  code: string,
  options: TemplateContentSourceOptions = {},
): TemplateContentSource | null {
  const template = getTemplateByCode(code);
  if (!template || template.status !== "published") return null;

  const theme = themeRegistry.getTheme(template.themeCode);
  if (!theme || theme.status !== "published") return null;

  const content = applyTemplateStarterSharedDefaults(
    clone(template.starterContent),
    options.sharedDefaults ?? OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
    options.templateOverride ?? {},
  );

  const source: TemplateContentSource = {
    code: template.code,
    version: theme.version,
    themeCode: template.themeCode,
    template,
    theme,
    content,
  };

  validateTemplateContentSource(source);
  return source;
}

export function createTemplateProvisioningPayload(
  source: TemplateContentSource,
  input: { ownerName: string; registrationIdentity?: TemplateRegistrationIdentity },
): ProvisionedTemplatePayload {
  const content = personalizeTemplateStarterContent(
    source.content,
    input.ownerName,
    input.registrationIdentity,
  );
  const sections = content.sections;

  return {
    templateCode: source.code,
    templateVersion: source.version,
    themeCode: source.themeCode,
    themeVersion: source.theme.version,
    themeConfig: clone(content.themeSettings),
    site: { title: content.site.title, description: content.site.description },
    sections: [
      { type: "hero", title: sections.hero.title, sortOrder: sections.hero.sortOrder, isVisible: sections.hero.isVisible, data: { headline: sections.hero.headline, subheadline: sections.hero.subheadline, imageUrl: sections.hero.imageUrl, overlay: sections.hero.overlay, position: sections.hero.position, height: sections.hero.height, cta: clone(sections.hero.cta), settings: clone(sections.hero.settings) } },
      { type: "gallery", title: sections.gallery.title, sortOrder: sections.gallery.sortOrder, isVisible: sections.gallery.isVisible, data: { title: sections.gallery.title, description: sections.gallery.description, settings: clone(sections.gallery.settings) } },
      { type: "packages", title: sections.packages.title, sortOrder: sections.packages.sortOrder, isVisible: sections.packages.isVisible, data: { title: sections.packages.title, description: sections.packages.description, settings: clone(sections.packages.settings) } },
      { type: "extras", title: sections.extras.title, sortOrder: sections.extras.sortOrder, isVisible: sections.extras.isVisible, data: { title: sections.extras.title, description: sections.extras.description, settings: clone(sections.extras.settings) } },
      { type: "contact", title: sections.contact.title, sortOrder: sections.contact.sortOrder, isVisible: sections.contact.isVisible, data: { callToAction: sections.contact.callToAction, settings: clone(sections.contact.settings) } },
    ],
    contact: { ...clone(content.contact), callToAction: sections.contact.callToAction },
    packages: content.packages.map((item) => ({ ...item, price: formatMoney(item.priceAmount, item.currency) })),
    extras: content.extras.map((item) => ({ ...item, price: formatMoney(item.priceAmount, item.currency) })),
    gallery: clone(content.gallery),
    seo: {
      title: content.seo.title,
      description: content.seo.description,
      canonicalUrl: content.seo.canonicalUrl,
      robotsIndex: content.seo.robotsIndex,
      structuredDataOverrides: clone(content.seo.structuredData),
    },
  };
}

export function buildTemplatePreviewViewModel(source: TemplateContentSource): PublicSiteViewModel {
  const payload = createTemplateProvisioningPayload(source, { ownerName: source.content.site.title });
  const heroSection = payload.sections.find((section) => section.type === "hero");
  const normalizedSections = normalizeTemplateSections(payload.sections);
  const heroSettings = resolveHeroSettings(heroSection?.data ?? {});

  return {
    siteId: "preview",
    themeCode: payload.themeCode,
    publicUrl: `https://frameid.app/templates/${source.code}/preview`,
    metadata: {
      title: payload.seo.title,
      description: payload.seo.description,
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        title: payload.seo.title,
        description: payload.seo.description,
        images: heroSection?.data.imageUrl ? [{ url: String(heroSection.data.imageUrl), alt: payload.site.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: payload.seo.title,
        description: payload.seo.description,
        images: heroSection?.data.imageUrl ? [String(heroSection.data.imageUrl)] : undefined,
      },
    },
    structuredData: payload.seo.structuredDataOverrides,
    sections: normalizedSections.sections,
    orderedSections: normalizedSections.orderedSections,
    hero: {
      headline: String(heroSection?.data.headline ?? payload.site.title),
      subheadline: String(heroSection?.data.subheadline ?? payload.site.description),
      imageUrl: String(heroSection?.data.imageUrl ?? payload.gallery.images[0]?.url ?? ""),
      ...heroSettings,
    },
    contact: {
      studioName: payload.contact.studioName,
      bio: payload.contact.bio,
      longDescription: payload.contact.longDescription,
      callToAction: payload.contact.callToAction,
      phone: payload.contact.phone,
      whatsapp: payload.contact.whatsapp,
      email: payload.contact.email,
      instagram: payload.contact.instagram,
      facebook: payload.contact.facebook,
      tiktok: payload.contact.tiktok,
      workLocation: payload.contact.workLocation,
    },
    packages: payload.packages.map((item) => ({ ...item })),
    extras: payload.extras.map((item) => ({ ...item })),
    gallery: payload.gallery.images.map((item) => ({ id: item.id, url: item.url, alt: item.alt, caption: item.caption })),
  };
}

export function validateTemplateContentSource(source: TemplateContentSource): void {
  const { content } = source;
  const requiredSections = ["hero", "gallery", "packages", "extras", "contact"] as const;
  for (const section of requiredSections) {
    if (!content.sections[section]) throw new Error(`Template ${source.code} is missing ${section} section content`);
  }
  if (!content.packages.length) throw new Error(`Template ${source.code} is missing packages`);
  if (!content.extras.length) throw new Error(`Template ${source.code} is missing extra services`);
  if (!content.gallery.images.length) throw new Error(`Template ${source.code} is missing gallery images`);
}

const formatMoney = formatTemplatePrice;

function clone<T>(value: T): T {
  return structuredClone(value);
}
