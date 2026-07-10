import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

export type TemplateStarterSection = {
  type: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
  data: Record<string, unknown>;
};

export type TemplateStarterPackage = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceAmount: number;
  currency: string;
  features: string[];
  imageUrl: string | null;
  isHighlighted: boolean;
  sortOrder: number;
};

export type TemplateStarterExtra = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  iconKey: string;
  sortOrder: number;
};

export type TemplateStarterGalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  sortOrder: number;
  isFeatured: boolean;
};

export type TemplateStarterData = {
  code: string;
  themeCode: string;
  demoName: string;
  title: string;
  description: string;
  previewImage: string;
  themeConfig: Record<string, unknown>;
  hero: {
    headline: string;
    subheadline: string;
    imageUrl: string;
  };
  contact: {
    studioName: string;
    bio: string;
    longDescription: string;
    callToAction: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    instagram: string | null;
    facebook: string | null;
  };
  seo: {
    title: string;
    description: string;
    robotsIndex: boolean;
    structuredDataOverrides: Record<string, unknown>;
  };
  sections: TemplateStarterSection[];
  packages: TemplateStarterPackage[];
  extras: TemplateStarterExtra[];
  gallery: TemplateStarterGalleryImage[];
};

export type TemplateSignupContent = {
  themeConfig: Record<string, unknown>;
  contact: TemplateStarterData["contact"];
  seo: TemplateStarterData["seo"];
  sections: TemplateStarterSection[];
  packages: TemplateStarterPackage[];
  extras: TemplateStarterExtra[];
  gallery: TemplateStarterGalleryImage[];
};

const DEFAULT_TEMPLATE_CODE = "noir-gold";

const NOIR_GALLERY = [
  { id: "noir-1", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85", alt: "لقطة زفاف خارجية", caption: "لحظة تبادل الخواتم" },
  { id: "noir-2", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85", alt: "تفاصيل بوكيه الزفاف", caption: "تفاصيل الباقة" },
  { id: "noir-3", url: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=1200&q=85", alt: "جلسة تصوير العروسين", caption: "جلسة العروسين" },
  { id: "noir-4", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85", alt: "ديكور حفل زفاف", caption: "قاعة الزفاف" }
] as const;

const ROSE_GALLERY = [
  { id: "rose-1", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85", alt: "عروسان في جلسة تصوير ناعمة", caption: "جلسة هادئة" },
  { id: "rose-2", url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85", alt: "تفاصيل ورد وديكور", caption: "تفاصيل رومانسية" },
  { id: "rose-3", url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=85", alt: "تصوير خطوبة ناعم", caption: "جلسة خطوبة" },
  { id: "rose-4", url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=85", alt: "قاعة زفاف بإضاءة طبيعية", caption: "إضاءة طبيعية" }
] as const;

const TEMPLATE_STARTERS: Record<string, TemplateStarterData> = {
  "noir-gold": {
    code: "noir-gold",
    themeCode: "noir-gold",
    demoName: "أحمد علي",
    title: "أحمد علي",
    description: "تصوير زفاف وخطوبة وجلسات خاصة بأسلوب فاخر — بساطة، إضاءة سينمائية، وألوان طبيعية.",
    previewImage: NOIR_GALLERY[0].url,
    themeConfig: { colorPreset: "champagne", layoutDensity: "editorial", motion: "quiet" },
    hero: {
      headline: "أحمد علي",
      subheadline: "تصوير زفاف وخطوبة وجلسات خاصة بأسلوب فاخر — بساطة، إضاءة سينمائية، وألوان طبيعية.",
      imageUrl: NOIR_GALLERY[0].url
    },
    contact: {
      studioName: "أحمد علي",
      bio: "مصور زفاف وجلسات خاصة",
      longDescription: "نحكي اليوم بصور هادئة وتفاصيل حقيقية، من التحضيرات الأولى وحتى آخر لقطة في الحفل.",
      callToAction: "احجز موعدك",
      phone: "+201001112233",
      whatsapp: "201001112233",
      email: "hello@classic-studio.example",
      instagram: "classic.studio",
      facebook: "classic.studio"
    },
    seo: {
      title: "أحمد علي — تصوير زفاف فاخر",
      description: "موقع تصوير زفاف وخطوبة وجلسات خاصة بأسلوب كلاسيكي فاخر.",
      robotsIndex: true,
      structuredDataOverrides: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "أحمد علي",
        description: "تصوير زفاف وخطوبة وجلسات خاصة"
      }
    },
    sections: [
      { type: "hero", title: "الرئيسية", sortOrder: 0, isVisible: true, data: { headline: "أحمد علي", subheadline: "تصوير زفاف وخطوبة وجلسات خاصة بأسلوب فاخر — بساطة، إضاءة سينمائية، وألوان طبيعية.", imageUrl: NOIR_GALLERY[0].url } },
      { type: "gallery", title: "الأعمال", sortOrder: 1, isVisible: true, data: { title: "لمحات من الأعمال", description: "مختارات من جلسات الزفاف والخطوبة بتفاصيل قريبة وإضاءة طبيعية." } },
      { type: "packages", title: "الباقات", sortOrder: 2, isVisible: true, data: { title: "اختر باقتك", description: "اختار التغطية الأنسب ليومك، ويمكنك إضافة أي خدمة تحتاجها قبل تأكيد الحجز." } },
      { type: "extras", title: "الإضافات", sortOrder: 3, isVisible: true, data: { title: "إضافات مميزة", description: "أضف خدمة تصوير أو ألبوم أو فيديو حسب احتياج اليوم." } },
      { type: "contact", title: "الحجز", sortOrder: 4, isVisible: true, data: { callToAction: "احجز موعدك" } }
    ],
    packages: [
      { id: "bronze", name: "الباقة البرونزية", subtitle: "جلسة تصوير بسيطة", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", features: ["3 ساعات", "جميع الصور المعدلة", "معرض إلكتروني", "تسليم خلال 7 أيام"], imageUrl: NOIR_GALLERY[1].url, isHighlighted: false, sortOrder: 0 },
      { id: "silver", name: "الباقة الفضية", subtitle: "نصف يوم تصوير", price: "5,000 جنيه", priceAmount: 5000, currency: "EGP", features: ["نصف يوم", "جميع الصور المعدلة", "ألبوم فاخر", "فيديو Highlight"], imageUrl: NOIR_GALLERY[2].url, isHighlighted: true, sortOrder: 1 },
      { id: "gold", name: "الباقة الذهبية", subtitle: "تغطية يوم كامل", price: "8,500 جنيه", priceAmount: 8500, currency: "EGP", features: ["يوم كامل", "تصوير العريس والعروسة", "فيديو سينمائي", "ألبوم فاخر", "معرض إلكتروني", "تسليم سريع"], imageUrl: NOIR_GALLERY[3].url, isHighlighted: false, sortOrder: 2 }
    ],
    extras: [
      { id: "cinematic", name: "فيديو سينمائي", description: "فيلم قصير يلخص أجمل لحظات اليوم.", price: "3,000 جنيه", priceAmount: 3000, currency: "EGP", iconKey: "video", sortOrder: 0 },
      { id: "drone", name: "Drone", description: "لقطات جوية للمكان والاحتفال.", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", iconKey: "camera", sortOrder: 1 },
      { id: "pre-wedding", name: "جلسة قبل الزفاف", description: "جلسة خارجية قبل يوم الزفاف.", price: "2,000 جنيه", priceAmount: 2000, currency: "EGP", iconKey: "camera", sortOrder: 2 },
      { id: "album", name: "ألبوم فاخر", description: "ألبوم مطبوع بتغليف فاخر.", price: "1,500 جنيه", priceAmount: 1500, currency: "EGP", iconKey: "album", sortOrder: 3 }
    ],
    gallery: NOIR_GALLERY.map((image, index) => ({ ...image, sortOrder: index, isFeatured: index === 0 }))
  },
  "rose-blush": {
    code: "rose-blush",
    themeCode: "rose-blush",
    demoName: "ليلى حسن",
    title: "ليلى حسن",
    description: "تصوير فني ناعم لحفلات الزفاف والخطوبة والجلسات الخاصة بإحساس هادئ وألوان دافئة.",
    previewImage: ROSE_GALLERY[0].url,
    themeConfig: { colorPreset: "rose", layoutDensity: "spacious", motion: "gentle" },
    hero: {
      headline: "ليلى حسن",
      subheadline: "تصوير فني ناعم لحفلات الزفاف والخطوبة والجلسات الخاصة بإحساس هادئ وألوان دافئة.",
      imageUrl: ROSE_GALLERY[0].url
    },
    contact: {
      studioName: "ليلى حسن",
      bio: "تصوير فني هادئ",
      longDescription: "نهتم بالتفاصيل الصغيرة واللحظات العفوية، ونقدّم تجربة تصوير ناعمة من أول تواصل حتى تسليم المعرض.",
      callToAction: "احجزي جلستك",
      phone: "+201002223344",
      whatsapp: "201002223344",
      email: "hello@rose-studio.example",
      instagram: "rose.blush.studio",
      facebook: "rose.blush.studio"
    },
    seo: {
      title: "ليلى حسن — تصوير فني هادئ",
      description: "موقع تصوير زفاف وخطوبة وجلسات خاصة بتصميم وردي هادئ.",
      robotsIndex: true,
      structuredDataOverrides: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "ليلى حسن",
        description: "تصوير فني هادئ لحفلات الزفاف والجلسات الخاصة"
      }
    },
    sections: [
      { type: "hero", title: "الرئيسية", sortOrder: 0, isVisible: true, data: { headline: "ليلى حسن", subheadline: "تصوير فني ناعم لحفلات الزفاف والخطوبة والجلسات الخاصة بإحساس هادئ وألوان دافئة.", imageUrl: ROSE_GALLERY[0].url } },
      { type: "gallery", title: "الأعمال", sortOrder: 1, isVisible: true, data: { title: "لحظات لا تُنسى", description: "كل صورة تحكي قصة، وكل قصة تستحق أن تُروى بجمال." } },
      { type: "packages", title: "الباقات", sortOrder: 2, isVisible: true, data: { title: "اختاري باقتك المثالية", description: "باقات مرنة تناسب كل مناسبة، مع لمسات احترافية لا تُنسى." } },
      { type: "extras", title: "الإضافات", sortOrder: 3, isVisible: true, data: { title: "لمسة إضافية", description: "اجعل تجربتك أكثر تميزًا مع هذه الإضافات." } },
      { type: "contact", title: "الحجز", sortOrder: 4, isVisible: true, data: { callToAction: "احجزي جلستك" } }
    ],
    packages: [
      { id: "soft", name: "الباقة الناعمة", subtitle: "جلسة قصيرة", price: "2,200 جنيه", priceAmount: 2200, currency: "EGP", features: ["ساعتان تصوير", "30 صورة معدلة", "معرض إلكتروني", "تسليم خلال 5 أيام"], imageUrl: ROSE_GALLERY[1].url, isHighlighted: false, sortOrder: 0 },
      { id: "story", name: "باقة القصة", subtitle: "نصف يوم تصوير", price: "4,800 جنيه", priceAmount: 4800, currency: "EGP", features: ["5 ساعات تصوير", "كل الصور المختارة", "ألبوم فاخر", "فيديو قصير"], imageUrl: ROSE_GALLERY[2].url, isHighlighted: true, sortOrder: 1 },
      { id: "dream", name: "باقة الحلم", subtitle: "تغطية كاملة", price: "8,000 جنيه", priceAmount: 8000, currency: "EGP", features: ["يوم كامل", "فريق تصوير", "فيديو سينمائي", "ألبومان", "تسليم سريع"], imageUrl: ROSE_GALLERY[3].url, isHighlighted: false, sortOrder: 2 }
    ],
    extras: [
      { id: "film", name: "فيلم قصير", description: "فيديو ناعم يلخص أجمل اللحظات.", price: "2,800 جنيه", priceAmount: 2800, currency: "EGP", iconKey: "film", sortOrder: 0 },
      { id: "team", name: "مصور إضافي", description: "تغطية زوايا أكثر خلال اليوم.", price: "2,000 جنيه", priceAmount: 2000, currency: "EGP", iconKey: "team", sortOrder: 1 },
      { id: "album", name: "ألبوم مطبوع", description: "ألبوم فاخر بتصميم هادئ.", price: "1,400 جنيه", priceAmount: 1400, currency: "EGP", iconKey: "album", sortOrder: 2 },
      { id: "outdoor", name: "جلسة خارجية", description: "جلسة تصوير في مكان تختارينه.", price: "1,800 جنيه", priceAmount: 1800, currency: "EGP", iconKey: "camera", sortOrder: 3 }
    ],
    gallery: ROSE_GALLERY.map((image, index) => ({ ...image, sortOrder: index, isFeatured: index === 0 }))
  }
};

export function getDefaultTemplateStarterCode() {
  return DEFAULT_TEMPLATE_CODE;
}

export function getTemplateStarterData(code: string): TemplateStarterData | null {
  const starter = TEMPLATE_STARTERS[code] ?? null;
  return starter ? cloneStarter(starter) : null;
}

export function getDefaultTemplateStarterData(): TemplateStarterData {
  return cloneStarter(TEMPLATE_STARTERS[DEFAULT_TEMPLATE_CODE]);
}

export function mergeTemplatePreviewData(code: string, previewData: unknown): TemplateStarterData {
  const base = getTemplateStarterData(code) ?? getDefaultTemplateStarterData();
  if (!isRecord(previewData)) return base;

  const hero = isRecord(previewData.hero) ? previewData.hero : {};
  const contact = isRecord(previewData.contact) ? previewData.contact : {};
  const seo = isRecord(previewData.seo) ? previewData.seo : {};

  base.title = text(previewData.title ?? previewData.headline, base.title);
  base.description = text(previewData.description ?? previewData.subtitle, base.description);
  base.previewImage = text(previewData.previewImage ?? previewData.thumbnail ?? previewData.image ?? previewData.cover, base.previewImage);
  base.hero = {
    headline: text(hero.headline ?? previewData.headline, base.hero.headline),
    subheadline: text(hero.subheadline ?? previewData.subtitle ?? previewData.description, base.hero.subheadline),
    imageUrl: text(hero.imageUrl ?? hero.image ?? hero.cover, base.hero.imageUrl)
  };
  base.contact = {
    ...base.contact,
    studioName: text(contact.studioName, base.contact.studioName),
    bio: text(contact.bio, base.contact.bio),
    longDescription: text(contact.longDescription, base.contact.longDescription),
    callToAction: text(previewData.callToAction ?? contact.callToAction, base.contact.callToAction),
    phone: nullableText(contact.phone, base.contact.phone),
    whatsapp: nullableText(contact.whatsapp, base.contact.whatsapp),
    email: nullableText(contact.email, base.contact.email),
    instagram: nullableText(contact.instagram, base.contact.instagram),
    facebook: nullableText(contact.facebook, base.contact.facebook)
  };
  base.seo = {
    title: text(seo.title, base.seo.title),
    description: text(seo.description, base.seo.description),
    robotsIndex: typeof seo.robotsIndex === "boolean" ? seo.robotsIndex : base.seo.robotsIndex,
    structuredDataOverrides: isRecord(seo.structuredDataOverrides) ? seo.structuredDataOverrides : base.seo.structuredDataOverrides
  };
  if (Array.isArray(previewData.packages)) base.packages = normalizePackages(previewData.packages, base.packages);
  if (Array.isArray(previewData.extras)) base.extras = normalizeExtras(previewData.extras, base.extras);
  if (Array.isArray(previewData.gallery)) base.gallery = normalizeGallery(previewData.gallery, base.gallery);
  return base;
}

export function personalizeTemplateStarterData(starter: TemplateStarterData, ownerName: string): TemplateStarterData {
  const cleanOwnerName = ownerName.trim();
  if (!cleanOwnerName) return cloneStarter(starter);
  return replaceDemoName(cloneStarter(starter), starter.demoName, cleanOwnerName);
}

export function validateTemplateStarterData(starter: TemplateStarterData): void {
  if (!starter.code || !starter.themeCode) throw new Error("Template starter data is missing identity fields");
  if (!starter.hero.headline || !starter.hero.subheadline || !starter.hero.imageUrl) throw new Error(`Template ${starter.code} is missing required hero data`);
  if (!starter.sections.length) throw new Error(`Template ${starter.code} is missing sections`);
  if (!starter.gallery.length || starter.gallery.some((image) => !image.url)) throw new Error(`Template ${starter.code} is missing gallery images`);
  if (!starter.packages.length || starter.packages.some((item) => !item.name || !item.priceAmount)) throw new Error(`Template ${starter.code} is missing package data`);
  if (!starter.extras.length || starter.extras.some((item) => !item.name)) throw new Error(`Template ${starter.code} is missing extra service data`);
}

export function createSignupContentFromStarter(starter: TemplateStarterData): TemplateSignupContent {
  validateTemplateStarterData(starter);
  return {
    themeConfig: cloneRecord(starter.themeConfig),
    contact: cloneRecord(starter.contact) as TemplateStarterData["contact"],
    seo: cloneRecord(starter.seo) as TemplateStarterData["seo"],
    sections: starter.sections.map((section) => ({ ...section, data: cloneRecord(section.data) })),
    packages: starter.packages.map((item) => ({ ...item, features: [...item.features] })),
    extras: starter.extras.map((item) => ({ ...item })),
    gallery: starter.gallery.map((item) => ({ ...item }))
  };
}

export function templateStarterToPreviewData(starter: TemplateStarterData): Record<string, unknown> {
  return {
    title: starter.title,
    headline: starter.title,
    description: starter.description,
    subtitle: starter.description,
    previewImage: starter.previewImage,
    hero: starter.hero,
    contact: starter.contact,
    callToAction: starter.contact.callToAction,
    seo: starter.seo,
    sections: starter.sections,
    packages: starter.packages,
    extras: starter.extras,
    gallery: starter.gallery
  };
}

export function buildPreviewSiteFromStarter(starter: TemplateStarterData): PublicSiteViewModel {
  return {
    siteId: "preview",
    themeCode: starter.themeCode,
    publicUrl: `https://frameid.app/templates/${starter.code}/preview`,
    metadata: {
      title: starter.seo.title,
      description: starter.seo.description,
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        title: starter.seo.title,
        description: starter.seo.description,
        images: starter.previewImage ? [{ url: starter.previewImage, alt: starter.title }] : undefined
      },
      twitter: {
        card: "summary_large_image",
        title: starter.seo.title,
        description: starter.seo.description,
        images: starter.previewImage ? [starter.previewImage] : undefined
      }
    },
    structuredData: starter.seo.structuredDataOverrides,
    hero: starter.hero,
    contact: starter.contact,
    packages: starter.packages.map((item) => ({ ...item })),
    extras: starter.extras.map((item) => ({ id: item.id, name: item.name, price: item.price, priceAmount: item.priceAmount, currency: item.currency, iconKey: item.iconKey })),
    gallery: starter.gallery.map((item) => ({ id: item.id, url: item.url, alt: item.alt, caption: item.caption }))
  };
}

function normalizePackages(value: unknown[], fallback: TemplateStarterPackage[]): TemplateStarterPackage[] {
  const rows = value.filter(isRecord).filter((item) => item.enabled !== false && item.isActive !== false);
  if (!rows.length) return fallback;
  return rows.map((item, index) => {
    const backup = fallback[index] ?? fallback[0];
    const currency = text(item.currency, backup.currency);
    const priceAmount = number(item.priceAmount, backup.priceAmount);
    return {
      id: text(item.id, backup.id ?? `package-${index + 1}`),
      name: text(item.name, backup.name),
      subtitle: text(item.subtitle, backup.subtitle),
      price: text(item.price, formatMoney(priceAmount, currency)),
      priceAmount,
      currency,
      features: readStringList(item.features, backup.features),
      imageUrl: nullableText(item.imageUrl, backup.imageUrl),
      isHighlighted: typeof item.isHighlighted === "boolean" ? item.isHighlighted : backup.isHighlighted,
      sortOrder: number(item.sortOrder, index)
    };
  });
}

function normalizeExtras(value: unknown[], fallback: TemplateStarterExtra[]): TemplateStarterExtra[] {
  const rows = value.filter(isRecord).filter((item) => item.enabled !== false && item.isActive !== false);
  if (!rows.length) return fallback;
  return rows.map((item, index) => {
    const backup = fallback[index] ?? fallback[0];
    const currency = text(item.currency, backup.currency);
    const priceAmount = number(item.priceAmount, backup.priceAmount);
    return {
      id: text(item.id, backup.id ?? `extra-${index + 1}`),
      name: text(item.name, backup.name),
      description: text(item.description, backup.description),
      price: text(item.price, formatMoney(priceAmount, currency)),
      priceAmount,
      currency,
      iconKey: text(item.iconKey, backup.iconKey),
      sortOrder: number(item.sortOrder, index)
    };
  });
}

function normalizeGallery(value: unknown[], fallback: TemplateStarterGalleryImage[]): TemplateStarterGalleryImage[] {
  const rows = value.filter(isRecord).filter((item) => typeof item.url === "string" && item.url.trim());
  if (!rows.length) return fallback;
  return rows.map((item, index) => ({
    id: text(item.id, `gallery-${index + 1}`),
    url: text(item.url, fallback[index]?.url ?? fallback[0].url),
    alt: text(item.alt, fallback[index]?.alt ?? "صورة من المعرض"),
    caption: nullableText(item.caption, fallback[index]?.caption ?? null),
    sortOrder: number(item.sortOrder, index),
    isFeatured: typeof item.isFeatured === "boolean" ? item.isFeatured : index === 0
  }));
}

function readStringList(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((item) => item.trim()).filter(Boolean);
  return [...fallback];
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableText(value: unknown, fallback: string | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneStarter(starter: TemplateStarterData): TemplateStarterData {
  return JSON.parse(JSON.stringify(starter)) as TemplateStarterData;
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceDemoName<T>(value: T, demoName: string, ownerName: string): T {
  if (typeof value === "string") return value.replaceAll(demoName, ownerName) as T;
  if (Array.isArray(value)) return value.map((item) => replaceDemoName(item, demoName, ownerName)) as T;
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDemoName(item, demoName, ownerName)])) as T;
  }
  return value;
}

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency === "EGP" ? "جنيه" : currency}`;
}
