import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
import { TemplatePreviewGuard } from "@/components/themes/template-preview-guard";
import { prisma } from "@/lib/prisma";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "معاينة القالب",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ embed?: string }>;
};

type JsonRecord = Record<string, unknown>;

type EditableTemplateRow = {
  name: string;
  status: string;
  previewData: unknown;
} | null;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberFrom(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(number) ? number : fallback;
}

function boolFrom(value: unknown, fallback = false) {
  if (value === true || value === "true" || value === "on") return true;
  if (value === false || value === "false" || value === "off") return false;
  return fallback;
}

function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split("\n").map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizePreviewPackages(value: unknown): PublicSiteViewModel["packages"] | null {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(isRecord).filter((item) => item.enabled !== false && item.isActive !== false);
  return rows.map((item, index) => {
    const currency = stringFrom(item.currency, "EGP");
    const priceAmount = numberFrom(item.priceAmount);
    return {
      id: stringFrom(item.id, `package-${index + 1}`),
      name: stringFrom(item.name, `باقة ${index + 1}`),
      subtitle: stringFrom(item.subtitle) || null,
      price: stringFrom(item.price, formatTotal(priceAmount, currency)),
      priceAmount,
      currency,
      features: readStringList(item.features),
      imageUrl: stringFrom(item.imageUrl) || null,
      isHighlighted: boolFrom(item.isHighlighted)
    };
  });
}

function normalizePreviewExtras(value: unknown): PublicSiteViewModel["extras"] | null {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(isRecord).filter((item) => item.enabled !== false && item.isActive !== false);
  return rows.map((item, index) => {
    const currency = stringFrom(item.currency, "EGP");
    const priceAmount = numberFrom(item.priceAmount);
    return {
      id: stringFrom(item.id, `extra-${index + 1}`),
      name: stringFrom(item.name, `إضافة ${index + 1}`),
      price: stringFrom(item.price, formatTotal(priceAmount, currency)),
      priceAmount,
      currency,
      iconKey: stringFrom(item.iconKey, "camera")
    };
  });
}

function buildEditablePreviewSite({
  code,
  registryName,
  row
}: {
  code: string;
  registryName: string;
  row: EditableTemplateRow;
}): PublicSiteViewModel {
  const previewData = isRecord(row?.previewData) ? row.previewData : {};
  const hero = isRecord(previewData.hero) ? previewData.hero : {};
  const packages = normalizePreviewPackages(previewData.packages) ?? previewSite.packages;
  const extras = normalizePreviewExtras(previewData.extras) ?? previewSite.extras;
  const title = stringFrom(previewData.title, row?.name ?? registryName);
  const description = stringFrom(previewData.description, previewSite.hero.subheadline);
  const imageUrl = stringFrom(
    hero.imageUrl ?? hero.image ?? previewData.previewImage ?? previewData.image,
    previewSite.hero.imageUrl
  );

  return {
    ...previewSite,
    siteId: "preview",
    themeCode: code,
    publicUrl: `https://frameid.app/templates/${code}/preview`,
    metadata: {
      title,
      description,
      robots: { index: false, follow: false }
    },
    hero: {
      headline: stringFrom(hero.headline ?? previewData.headline, title),
      subheadline: stringFrom(hero.subheadline ?? previewData.subtitle ?? previewData.description, description),
      imageUrl
    },
    contact: {
      ...previewSite.contact,
      callToAction: stringFrom(previewData.callToAction, previewSite.contact.callToAction)
    },
    packages,
    extras
  };
}

function formatTotal(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} ${currency === "EGP" ? "جنيه" : currency}`;
}

export default async function TemplatePreviewPage({ params, searchParams }: Props) {
  const { code } = await params;
  const query = await searchParams;
  const template = getTemplateByCode(code);

  if (!template || template.status !== "published") {
    notFound();
  }

  const editableTemplate = await prisma.template.findUnique({
    where: { code },
    select: { name: true, status: true, previewData: true }
  });

  if (editableTemplate && editableTemplate.status !== "PUBLISHED") {
    notFound();
  }

  const ThemeComponent = getThemeSiteComponent(code);
  const siteData = buildEditablePreviewSite({ code, registryName: template.name, row: editableTemplate });
  const isEmbed = query?.embed === "1";

  return (
    <>
      <TemplatePreviewGuard />
      <ThemeComponent site={siteData} />
      {isEmbed ? null : (
        <div data-preview-toolbar className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-2 rounded-[var(--radius-panel)] border border-white/10 bg-ink/80 p-2 shadow-soft backdrop-blur-xl">
          <Link href="/templates" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-white hover:bg-white/10">
            <ArrowRight className="size-4" aria-hidden />
            رجوع
          </Link>
          <Link href={`/signup?template=${template.code}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink">
            <WandSparkles className="size-4" aria-hidden />
            استخدم القالب ده
          </Link>
        </div>
      )}
    </>
  );
}

const DEMO_HERO_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85";

const DEMO_GALLERY_IMAGES = [
  { id: "demo-1", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=85", alt: "زفاف في الهواء الطلق", caption: "لحظة تبادل الخواتم" },
  { id: "demo-2", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=85", alt: "باقة ورد الزفاف", caption: "تفاصيل الباقة" },
  { id: "demo-3", url: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=800&q=85", alt: "جلسة تصوير زفاف", caption: "جلسة العروسين" },
  { id: "demo-4", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=85", alt: "ديكور حفل زفاف", caption: "قاعة الزفاف" }
];

const previewSite: PublicSiteViewModel = {
  siteId: "preview",
  themeCode: "noir-gold",
  publicUrl: "https://frameid.app/templates/preview",
  metadata: { title: "كلاسك — تصوير زفاف فاخر" },
  structuredData: { "@context": "https://schema.org", "@type": "LocalBusiness", name: "كلاسك" },
  hero: {
    headline: "بنصنع ذكريات تفضل طول العمر",
    subheadline: "تصوير زفاف وخطوبة وجلسات خاصة بأسلوب فاخر—بساطة، إضاءة سينمائية، وألوان طبيعية.",
    imageUrl: DEMO_HERO_IMAGE
  },
  contact: { callToAction: "احجز دلوقتي", phone: null, whatsapp: null, email: null, instagram: "bodystudio", facebook: "bodystudio" },
  packages: [
    { id: "bronze", name: "الباقة البرونزية", subtitle: "جلسة تصوير بسيطة", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", features: ["3 ساعات", "جميع الصور المعدلة", "معرض إلكتروني", "تسليم خلال 7 أيام"], imageUrl: null, isHighlighted: false },
    { id: "silver", name: "الباقة الفضية", subtitle: "نصف يوم تصوير", price: "5,000 جنيه", priceAmount: 5000, currency: "EGP", features: ["نصف يوم", "جميع الصور المعدلة", "ألبوم فاخر", "فيديو Highlight"], imageUrl: null, isHighlighted: true },
    { id: "gold", name: "الباقة الذهبية", subtitle: "تغطية يوم كامل", price: "8,500 جنيه", priceAmount: 8500, currency: "EGP", features: ["يوم كامل", "تصوير العريس والعروسة", "فيديو سينمائي", "ألبوم فاخر", "معرض إلكتروني", "تسليم سريع"], imageUrl: null, isHighlighted: false }
  ],
  extras: [
    { id: "cinematic", name: "فيديو سينمائي", price: "3,000 جنيه", priceAmount: 3000, currency: "EGP", iconKey: "video" },
    { id: "drone", name: "Drone", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", iconKey: "camera" },
    { id: "pre-wedding", name: "جلسة قبل الزفاف", price: "2,000 جنيه", priceAmount: 2000, currency: "EGP", iconKey: "camera" },
    { id: "album", name: "ألبوم فاخر", price: "1,500 جنيه", priceAmount: 1500, currency: "EGP", iconKey: "album" },
    { id: "printing", name: "طباعة إضافية", price: "حسب الطلب", priceAmount: 0, currency: "EGP", iconKey: "album" }
  ],
  gallery: DEMO_GALLERY_IMAGES
};
