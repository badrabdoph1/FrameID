import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { AliAhmedLuxurySite } from "@/components/themes/ali-ahmed-luxury-site";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "معاينة القالب",
  robots: {
    index: false,
    follow: false
  }
};

type Props = {
  params: Promise<{ code: string }>;
};

export default async function TemplatePreviewPage({ params }: Props) {
  const { code } = await params;
  const template = getTemplateByCode(code);

  if (!template || template.status !== "published") {
    notFound();
  }

  return (
    <>
      <AliAhmedLuxurySite site={previewSite} />
      <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-2 rounded-[var(--radius-panel)] border border-white/10 bg-ink/80 p-2 shadow-soft backdrop-blur-xl">
        <Link
          href="/templates"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowRight className="size-4" aria-hidden />
          رجوع
        </Link>
        <Link
          href={`/signup?template=${template.code}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink"
        >
          <WandSparkles className="size-4" aria-hidden />
          استخدام هذا القالب
        </Link>
      </div>
    </>
  );
}

const previewSite: PublicSiteViewModel = {
  siteId: "preview",
  themeCode: "noir-gold",
  publicUrl: "https://frameid.app/templates/noir-gold/preview",
  metadata: {
    title: "قالب علي أحمد الفاخر"
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "علي أحمد"
  },
  hero: {
    headline: "علي أحمد",
    subheadline: "باقات تصوير 2026 لتجربة زفاف وخطوبة أنيقة.",
    imageUrl:
      "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg"
  },
  contact: {
    callToAction: "تأكيد عبر واتساب",
    phone: "01068427413",
    whatsapp: "201068427413",
    email: null,
    instagram: "3li__a7mad_ph",
    facebook: "aliahmed8585"
  },
  packages: [
    {
      id: "silver",
      name: "الباقة الفضية",
      subtitle: "سيشن خطوبة / كتب كتاب",
      price: "2,500 جنيه",
      priceAmount: 2500,
      currency: "EGP",
      features: ["ألبوم وسط", "عدد الصور مفتوح", "تابلوه", "الوقت مفتوح"],
      imageUrl:
        "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg",
      isHighlighted: false
    },
    {
      id: "mini",
      name: "زفاف مختصر",
      subtitle: "سيشن زفاف",
      price: "4,000 جنيه",
      priceAmount: 4000,
      currency: "EGP",
      features: ["تصوير الفيرست لوك", "ألبوم وسط", "تابلوه", "تصوير القاعة"],
      imageUrl:
        "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg",
      isHighlighted: true
    },
    {
      id: "vip",
      name: "زفاف فاخر",
      subtitle: "سيشن زفاف فاخر",
      price: "4,500 جنيه",
      priceAmount: 4500,
      currency: "EGP",
      features: ["ألبوم كبير", "عدد الصور مفتوح", "تصوير القاعة", "تسليم ريلز"],
      imageUrl:
        "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg",
      isHighlighted: false
    }
  ],
  extras: [
    { id: "video", name: "فيديو برومو", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", iconKey: "video" },
    { id: "casual", name: "سيشن كاجوال", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", iconKey: "camera" },
    { id: "reel", name: "فيديو ريلز", price: "1,000 جنيه", priceAmount: 1000, currency: "EGP", iconKey: "film" },
    { id: "team", name: "فوتوجرافر إضافي", price: "1,000 جنيه", priceAmount: 1000, currency: "EGP", iconKey: "team" }
  ],
  gallery: []
};
