import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Images,
  Palette,
  Settings,
  ShoppingBag,
  WandSparkles,
  X
} from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";
import {
  benefitCards,
  betaTestimonial,
  comparisonData,
  faqItems,
  getTemplatePreviewImage,
  howItWorks
} from "@/modules/marketing/platform-content";

const siteUrl = "https://frameid.app";
const heroImage =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85";

export const metadata: Metadata = {
  title: "FrameID | موقع مصور—موقع خاص باسمك يضم أعمالك وباقاتك",
  description:
    "موقع خاص للمصورين: معرض أعمال، باقات وأسعار، رابط خاص، ولوحة تحكم. بدون برمجة. جرب ١٤ يوم مجاناً.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "FrameID | موقع خاص باسمك—يضم أعمالك وباقاتك",
    description:
      "خلال دقائق، حول صورك إلى موقع متكامل: معرض أعمال، باقات، رابط خاص. جرب مجاناً.",
    url: siteUrl,
    siteName: "FrameID",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "FrameID—منصة مواقع للمصورين"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameID | موقع خاص باسمك—يضم أعمالك وباقاتك",
    description: "موقع متكامل للمصور: معرض، باقات، رابط خاص. جرب مجاناً.",
    images: [heroImage]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "FrameID",
      url: siteUrl
    },
    {
      "@type": "WebSite",
      name: "FrameID",
      url: siteUrl,
      inLanguage: "ar"
    },
    {
      "@type": "SoftwareApplication",
      name: "FrameID",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "منصة عربية تمنح المصورين مواقع احترافية بقوالب جاهزة وروابط خاصة.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
        description: "تجربة مجانية ١٤ يوم بدون بطاقة بنكية"
      }
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

function DashboardMockup() {
  const items = [
    { icon: Images, label: "المعرض", desc: "إدارة صورك وترتيب ألبوماتك", color: "bg-amber-100 text-amber-800" },
    { icon: ShoppingBag, label: "الباقات", desc: "تحديد الخدمات والأسعار", color: "bg-emerald-100 text-emerald-800" },
    { icon: Palette, label: "التصميم", desc: "تغيير القالب والألوان", color: "bg-violet-100 text-violet-800" },
    { icon: Settings, label: "الإعدادات", desc: "بياناتك ورابطك والـ SEO", color: "bg-sky-100 text-sky-800" }
  ];

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-white shadow-soft">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-danger" />
          <span className="size-2.5 rounded-full bg-warning" />
          <span className="size-2.5 rounded-full bg-success" />
        </div>
        <span className="mr-2 text-xs text-muted-foreground">frameid.app/dashboard</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4 transition hover:shadow-soft"
          >
            <div className={`inline-flex size-9 items-center justify-center rounded-lg ${item.color}`}>
              <item.icon className="size-4" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-semibold">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const templates = getPublishedTemplates();

  return (
    <>
      <MarketingNav />
      <main id="main-content">
        {/* ──────────────── HERO ──────────────── */}
        <section className="relative min-h-[90dvh] overflow-hidden bg-ink text-white">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.35),rgba(7,7,7,.82)_72%,#070707_100%)]" />
          <div className="container-page relative flex min-h-[90dvh] flex-col justify-center pb-12 pt-20 md:pb-16">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="mb-4 border-white/20 bg-white/10 text-white md:mb-5">
                منصة مواقع للمصورين
              </Badge>
              <h1 className="text-balance text-[clamp(1.75rem,5vw,4.5rem)] font-semibold leading-[1.08]">
                موقع خاص باسمك.
                <br />
                يضم أعمالك كلها—
                <span className="text-champagne">وتفتخر فيه قدام أي عميل.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/72 md:mt-5 md:text-lg md:leading-8">
                خلال دقائق، حول صورك إلى موقع متكامل: معرض أعمال مرتب، باقات وأسعار واضحة،
                رابط خاص، ولوحة تحكم بسيطة. بدون برمجة وبدون تعقيد.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-7 text-sm font-semibold text-ink transition-[background-color] hover:bg-champagne/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                >
                  ابدأ التجربة المجانية
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-[background-color,border-color] hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  شاهد القوالب
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70 md:mt-6">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                  تجربة مجانية ١٤ يوم
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                  بدون بطاقة بنكية
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                  موقع جاهز خلال دقائق
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── TEMPLATES ──────────────── */}
        <section className="container-page py-10 md:py-22">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                اختر قالبك
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
                قوالب جاهزة—تبدو وكأنها موقع لمصور محترف.
              </h2>
            </div>
            <Link
              href="/templates"
              className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-champagne-strong underline underline-offset-4 transition hover:text-champagne md:inline-flex"
            >
              عرض جميع القوالب
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5">
            {templates.map((template) => (
              <article
                key={template.code}
                className="group overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-soft transition hover:shadow-champagne"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={getTemplatePreviewImage(template)}
                    alt={`معاينة قالب ${template.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <Link
                    href={`/templates/${template.code}/preview`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Eye className="size-4" aria-hidden />
                    معاينة
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 text-center md:hidden">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 text-sm font-semibold text-champagne-strong underline underline-offset-4"
            >
              عرض جميع القوالب
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* ──────────────── WHY FRAMEID ──────────────── */}
        <section className="bg-surface py-10 md:py-22">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-champagne-strong">
                ليش تختار FrameID؟
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
                كل اللي يحتاجه المصور في مكان واحد.
              </h2>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 md:mt-8 md:grid-cols-4 md:gap-3">
              {benefitCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[var(--radius-card)] border border-border bg-background p-3 transition hover:shadow-soft md:p-4"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-champagne/15 text-champagne-strong md:size-8">
                    <CheckCircle2 className="size-3.5 md:size-4" aria-hidden />
                  </span>
                  <h3 className="mt-2 text-sm font-semibold md:mt-3">{card.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground md:mt-1 md:leading-6">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ابدأ التجربة المجانية
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────────── HOW IT WORKS ──────────────── */}
        <section className="container-page py-10 md:py-22">
          <div className="max-w-2xl text-center md:mx-auto">
            <p className="text-sm font-semibold text-champagne-strong">
              ٤ خطوات فقط
            </p>
            <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
              كيف تبدا؟
            </h2>
          </div>
          <div className="mt-8 grid gap-3 md:mt-10 md:grid-cols-4 md:gap-4">
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-[var(--radius-card)] border border-border bg-card p-4 text-center md:p-5"
              >
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-ink text-base font-semibold text-white md:size-12 md:text-lg">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold md:mt-4">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground md:mt-2 md:leading-7">
                  {step.body}
                </p>
                {index < howItWorks.length - 1 && (
                  <span
                    className="absolute -left-2 top-1/2 hidden -translate-y-1/2 text-champagne-strong/30 md:block"
                    aria-hidden
                  >
                    <ArrowLeft className="size-5" />
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ابدأ مجاناً—بدون بطاقة
            </Link>
          </div>
        </section>

        {/* ──────────────── COMPARISON ──────────────── */}
        <section className="bg-ink py-10 text-white md:py-22">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-champagne">
                مقارنة سريعة
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
                {comparisonData.headline}
              </h2>
            </div>
            <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-4">
              <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.04] p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white/60 md:size-10">
                    <X className="size-4 md:size-5" aria-hidden />
                  </span>
                  <h3 className="text-base font-semibold md:text-lg">{comparisonData.instagram.title}</h3>
                </div>
                <ul className="mt-4 space-y-2 md:mt-5 md:space-y-3">
                  {comparisonData.instagram.cons.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="size-1.5 shrink-0 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[var(--radius-panel)] border border-champagne/30 bg-champagne/[0.04] p-5 md:p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-champagne/20 text-champagne md:size-10">
                    <CheckCircle2 className="size-4 md:size-5" aria-hidden />
                  </span>
                  <h3 className="text-base font-semibold md:text-lg">{comparisonData.frameid.title}</h3>
                </div>
                <ul className="mt-4 space-y-2 md:mt-5 md:space-y-3">
                  {comparisonData.frameid.pros.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/85">
                      <span className="size-1.5 shrink-0 rounded-full bg-champagne" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-5 text-sm font-semibold text-ink transition-[background-color] hover:bg-champagne/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              >
                ابدأ التجربة المجانية
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────────── DASHBOARD ──────────────── */}
        <section className="container-page py-10 md:py-22">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                لوحة التحكم
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
                كل شيء تحت سيطرتك.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground md:leading-8">
                من لوحة واحدة تدير صورك، باقاتك، قوالبك، وإعدادات موقعك.
                بدون مبرمج وبدون دروس—كل شي واضح من أول دقيقة.
              </p>
              <ul className="mt-4 space-y-2 md:mt-6">
                <li className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  رفع الصور وإدارة المعرض
                </li>
                <li className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  إضافة الباقات وتحديد الأسعار
                </li>
                <li className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  تغيير القالب والألوان
                </li>
                <li className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  تعديل البيانات والـ SEO
                </li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  جرب اللوحة بنفسك
                </Link>
              </div>
            </div>
            <div className="order-first lg:order-last">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ──────────────── FAQ ──────────────── */}
        <section className="bg-surface py-10 md:py-22">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <p className="text-center text-sm font-semibold text-champagne-strong">
                أسئلة شائعة
              </p>
              <h2 className="mt-2 text-center text-2xl font-semibold md:text-5xl">
                إجابات سريعة
              </h2>
              <div className="mt-6 space-y-2 md:mt-8 md:space-y-3">
                {faqItems.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-[var(--radius-card)] border border-border bg-card transition hover:shadow-soft"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-semibold transition hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span
                        className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        aria-hidden
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </summary>
                    <div className="border-t border-border px-4 py-3 text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ابدأ التجربة المجانية
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────────── TESTIMONIALS ──────────────── */}
        <section className="container-page py-10 md:py-22">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-champagne-strong">
              آراء المصورين
            </p>
            <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
              وش يقولون المصورين عن FrameID؟
            </h2>
            <div className="mt-6 rounded-[var(--radius-panel)] border border-border bg-card p-6 md:mt-8 md:p-8">
              <p className="text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                {betaTestimonial.message}
              </p>
              <div className="mt-5 md:mt-6">
                <Link
                  href="/signup"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <WandSparkles className="size-4" aria-hidden />
                  سجل الآن—جرب وقلنا رأيك
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── FINAL CTA ──────────────── */}
        <section className="bg-ink py-14 text-white md:py-22">
          <div className="container-page text-center">
            <h2 className="text-balance text-2xl font-semibold md:text-5xl">
              جاهز تبدأ؟ موقعك ينتظرك.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/65 md:mt-4 md:text-base md:leading-8">
              جرب ١٤ يوم مجاناً—بدون بطاقة بنكية وبدون التزام. موقعك جاهز خلال دقائق.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 md:mt-8 md:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-7 text-sm font-semibold text-ink transition-[background-color] hover:bg-champagne/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              >
                ابدأ التجربة المجانية
              </Link>
              <Link
                href="/templates"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-[background-color,border-color] hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                شاهد القوالب
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────────── MOBILE STICKY CTA ──────────────── */}
        <section className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
          <div className="container-page flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold">جرب FrameID مجاناً</span>
            <Link
              href="/signup"
              className="mr-auto inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              ابدأ الآن
            </Link>
          </div>
        </section>

        <MarketingFooter />
      </main>
      <script
        id="frameid-home-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
