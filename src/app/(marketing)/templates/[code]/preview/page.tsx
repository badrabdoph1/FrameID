import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
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

  const ThemeComponent = getThemeSiteComponent(code);
  const siteData = { ...previewSite, themeCode: code };

  return (
    <>
      <ThemeComponent site={siteData} />
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

const DEMO_HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85";

const DEMO_GALLERY_IMAGES = [
  {
    id: "demo-1",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=85",
    alt: "زفاف في الهواء الطلق",
    caption: "لحظة تبادل الخواتم"
  },
  {
    id: "demo-2",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=85",
    alt: "باقة ورد الزفاف",
    caption: "تفاصيل الباقة"
  },
  {
    id: "demo-3",
    url: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=800&q=85",
    alt: "جلسة تصوير زفاف",
    caption: "جلسة العروسين"
  },
  {
    id: "demo-4",
    url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=85",
    alt: "ديكور حفل زفاف",
    caption: "قاعة الزفاف"
  }
];

const previewSite: PublicSiteViewModel = {
  siteId: "preview",
  themeCode: "noir-gold",
  publicUrl: "https://frameid.app/templates/preview",
  metadata: {
    title: "Kareem Magdy — تصوير زفاف فاخر"
  },
  structuredData: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Kareem Magdy"
  },
  hero: {
    headline: "نصنع ذكريات تبقى للأبد",
    subheadline:
      "تصوير حفلات الزفاف والخطوبة والجلسات الخاصة بأسلوب فاخر يجمع بين البساطة، والإضاءة السينمائية، والألوان الطبيعية.",
    imageUrl: DEMO_HERO_IMAGE
  },
  contact: {
    callToAction: "احجز الآن",
    phone: null,
    whatsapp: null,
    email: null,
    instagram: "bodystudio",
    facebook: "bodystudio"
  },
  packages: [
    {
      id: "bronze",
      name: "الباقة البرونزية",
      subtitle: "جلسة تصوير بسيطة",
      price: "2,500 جنيه",
      priceAmount: 2500,
      currency: "EGP",
      features: [
        "3 ساعات",
        "جميع الصور المعدلة",
        "معرض إلكتروني",
        "تسليم خلال 7 أيام"
      ],
      imageUrl: null,
      isHighlighted: false
    },
    {
      id: "silver",
      name: "الباقة الفضية",
      subtitle: "نصف يوم تصوير",
      price: "5,000 جنيه",
      priceAmount: 5000,
      currency: "EGP",
      features: [
        "نصف يوم",
        "جميع الصور المعدلة",
        "ألبوم فاخر",
        "فيديو Highlight"
      ],
      imageUrl: null,
      isHighlighted: true
    },
    {
      id: "gold",
      name: "الباقة الذهبية",
      subtitle: "تغطية يوم كامل",
      price: "8,500 جنيه",
      priceAmount: 8500,
      currency: "EGP",
      features: [
        "يوم كامل",
        "تصوير العريس والعروسة",
        "فيديو سينمائي",
        "ألبوم فاخر",
        "معرض إلكتروني",
        "تسليم سريع"
      ],
      imageUrl: null,
      isHighlighted: false
    }
  ],
  extras: [
    {
      id: "cinematic",
      name: "فيديو سينمائي",
      price: "3,000 جنيه",
      priceAmount: 3000,
      currency: "EGP",
      iconKey: "video"
    },
    {
      id: "drone",
      name: "Drone",
      price: "2,500 جنيه",
      priceAmount: 2500,
      currency: "EGP",
      iconKey: "camera"
    },
    {
      id: "pre-wedding",
      name: "جلسة قبل الزفاف",
      price: "2,000 جنيه",
      priceAmount: 2000,
      currency: "EGP",
      iconKey: "camera"
    },
    {
      id: "album",
      name: "ألبوم فاخر",
      price: "1,500 جنيه",
      priceAmount: 1500,
      currency: "EGP",
      iconKey: "album"
    },
    {
      id: "printing",
      name: "طباعة إضافية",
      price: "حسب الطلب",
      priceAmount: 0,
      currency: "EGP",
      iconKey: "album"
    }
  ],
  gallery: DEMO_GALLERY_IMAGES
};
