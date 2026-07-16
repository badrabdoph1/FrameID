export const PLATFORM_TEMPLATE_SECTION_TYPES = [
  "hero",
  "gallery",
  "packages",
  "extras",
  "contact",
] as const;

export type TemplateSectionType = (typeof PLATFORM_TEMPLATE_SECTION_TYPES)[number];
export type HeroOverlay = "none" | "soft" | "medium" | "strong";
export type HeroPosition = "center" | "top" | "bottom" | "left" | "right";
export type HeroHeight = "compact" | "screen" | "tall";
export type HeroCtaTarget = "packages" | "gallery" | "contact" | "whatsapp";
export type ContactChannel = "phone" | "whatsapp" | "instagram" | "facebook" | "tiktok" | "email";

export type HeroSettings = {
  overlay: HeroOverlay;
  position: HeroPosition;
  height: HeroHeight;
  cta: { label: string; target: HeroCtaTarget };
  eyebrow: string;
};

export type NormalizedTemplateSection = {
  type: TemplateSectionType;
  title: string;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  settings: Record<string, string | number>;
};

type RawTemplateSection = {
  type: string;
  title: string | null;
  sortOrder: number;
  isVisible?: boolean;
  data: Record<string, unknown>;
};

const SECTION_DEFAULTS: Record<TemplateSectionType, { title: string; settings: Record<string, string | number> }> = {
  hero: { title: "الرئيسية", settings: { eyebrow: "تصوير احترافي" } },
  gallery: { title: "معرض الأعمال", settings: { eyebrow: "أعمال مختارة", layout: "snap", limit: 6 } },
  packages: { title: "الباقات", settings: { eyebrow: "باقات التصوير", layout: "snap" } },
  extras: { title: "الإضافات", settings: { eyebrow: "خدمات إضافية", layout: "compact" } },
  contact: { title: "التواصل", settings: { eyebrow: "تواصل مباشر", layout: "grid" } },
};

const HERO_DEFAULTS: HeroSettings = {
  overlay: "medium",
  position: "center",
  height: "screen",
  cta: { label: "شاهد الباقات", target: "packages" },
  eyebrow: "تصوير احترافي",
};

export function isTemplateSectionType(value: string): value is TemplateSectionType {
  return PLATFORM_TEMPLATE_SECTION_TYPES.includes(value as TemplateSectionType);
}

export function normalizeTemplateSections(rawSections: RawTemplateSection[]) {
  const rawByType = new Map<TemplateSectionType, RawTemplateSection>();
  for (const section of rawSections) {
    if (isTemplateSectionType(section.type) && !rawByType.has(section.type)) rawByType.set(section.type, section);
  }

  const entries = PLATFORM_TEMPLATE_SECTION_TYPES.map((type, canonicalIndex) => {
    const raw = rawByType.get(type);
    const defaults = SECTION_DEFAULTS[type];
    const rawSettings = isRecord(raw?.data.settings) ? raw.data.settings : {};
    const settings = Object.fromEntries(
      Object.entries({ ...defaults.settings, ...rawSettings }).filter(([, value]) => typeof value === "string" || typeof value === "number"),
    ) as Record<string, string | number>;
    return {
      section: {
        type,
        title: cleanString(raw?.title) ?? defaults.title,
        description: cleanString(raw?.data.description),
        sortOrder: raw?.sortOrder ?? canonicalIndex,
        isVisible: raw?.isVisible ?? true,
        settings,
      } satisfies NormalizedTemplateSection,
      persisted: Boolean(raw),
      canonicalIndex,
    };
  });

  entries.sort((a, b) => a.section.sortOrder - b.section.sortOrder || Number(b.persisted) - Number(a.persisted) || a.canonicalIndex - b.canonicalIndex);
  const orderedSections = entries.map((entry) => entry.section);
  const sections = Object.fromEntries(orderedSections.map((section) => [section.type, section])) as Record<TemplateSectionType, NormalizedTemplateSection>;
  return { sections, orderedSections };
}

export function resolveHeroSettings(data: Record<string, unknown>): HeroSettings {
  const settings = isRecord(data.settings) ? data.settings : {};
  const cta = isRecord(data.cta) ? data.cta : {};
  return {
    overlay: isOneOf(data.overlay, ["none", "soft", "medium", "strong"]) ? data.overlay : HERO_DEFAULTS.overlay,
    position: isOneOf(data.position, ["center", "top", "bottom", "left", "right"]) ? data.position : HERO_DEFAULTS.position,
    height: isOneOf(data.height, ["compact", "screen", "tall"]) ? data.height : HERO_DEFAULTS.height,
    cta: {
      label: cleanString(cta.label) ?? HERO_DEFAULTS.cta.label,
      target: isOneOf(cta.target, ["packages", "gallery", "contact", "whatsapp"]) ? cta.target : HERO_DEFAULTS.cta.target,
    },
    eyebrow: cleanString(settings.eyebrow) ?? HERO_DEFAULTS.eyebrow,
  };
}

export function formatTemplatePrice(amount: number, currency: string): string {
  if (amount <= 0) return "السعر عند الطلب";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency === "EGP" ? "جنيه" : currency}`;
}

export function normalizeContactHref(channel: ContactChannel, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/iu.test(trimmed)) return trimmed;
  if (channel === "phone") return `tel:${normalizePhone(trimmed, true)}`;
  if (channel === "whatsapp") return `https://wa.me/${normalizePhone(trimmed, false)}`;
  if (channel === "email") return `mailto:${trimmed}`;
  if (channel === "instagram") return `https://instagram.com/${trimmed.replace(/^@/u, "")}`;
  if (channel === "facebook") return `https://facebook.com/${trimmed.replace(/^@/u, "")}`;
  return `https://tiktok.com/${trimmed.startsWith("@") ? trimmed : `@${trimmed}`}`;
}

export function resolveHeroCtaHref(settings: HeroSettings, contact: { whatsapp: string | null }): string {
  if (settings.cta.target === "whatsapp" && contact.whatsapp) return normalizeContactHref("whatsapp", contact.whatsapp);
  return `#${settings.cta.target === "whatsapp" ? "contact" : settings.cta.target}`;
}

export function createTemplateBookingHref({ whatsapp, email, selectedPackage, selectedExtras }: {
  siteName?: string;
  whatsapp: string | null;
  email: string | null;
  selectedPackage: { name: string; price: string; priceAmount: number; currency: string } | undefined;
  selectedExtras: Array<{ name: string; price: string; priceAmount: number }>;
}): string {
  if (!selectedPackage) return "#packages";
  const total = selectedPackage.priceAmount + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0);
  const message = [
    `مرحبًا، أريد حجز باقة تصوير.`,
    `الباقة: ${selectedPackage.name} (${selectedPackage.price})`,
    selectedExtras.length ? `الإضافات: ${selectedExtras.map((item) => `${item.name} (${item.price})`).join("، ")}` : "الإضافات: لا يوجد",
    `الإجمالي التقريبي: ${formatTemplatePrice(total, selectedPackage.currency)}`,
  ].join("\n");
  if (whatsapp) return `${normalizeContactHref("whatsapp", whatsapp)}?text=${encodeURIComponent(message)}`;
  if (email) return `${normalizeContactHref("email", email)}?subject=${encodeURIComponent(`حجز ${selectedPackage.name}`)}&body=${encodeURIComponent(message)}`;
  return `mailto:?subject=${encodeURIComponent(`حجز ${selectedPackage.name}`)}&body=${encodeURIComponent(message)}`;
}

function normalizePhone(value: string, keepPlus: boolean) {
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/[^\d]/gu, "");
  return keepPlus && hasPlus ? `+${digits}` : digits;
}
function cleanString(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T { return typeof value === "string" && options.includes(value as T); }
