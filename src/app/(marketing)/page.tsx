import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Images,
  LayoutDashboard,
  PanelsTopLeft,
  Sparkles,
  Star
} from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminControls,
  faqItems,
  onboardingJourney,
  photographerControls,
  platformStats,
  testimonials
} from "@/modules/marketing/platform-content";

const siteUrl = "https://frameid.app";
const heroImage =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85";

export const metadata: Metadata = {
  title: "موقع مصور جاهز خلال دقائق",
  description:
    "FrameID يمنح المصور موقعًا احترافيًا، رابطًا خاصًا، قالبًا حيًا، وتجربة مجانية قبل الدفع.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description:
      "موقع احترافي للمصورين: قالب حي، رابط خاص، وتجربة مجانية قبل الدفع.",
    url: siteUrl,
    siteName: "FrameID",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "FrameID منصة مواقع للمصورين"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description: "قالب حي ورابط خاص وتجربة مجانية قبل الدفع.",
    images: [heroImage]
  }
};

const trustSignals = ["لا يوجد دفع قبل التجربة", "قالب حي", "رابط خاص"];

const productPillars = [
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم هادئة",
    body: "عدّل رابطك، صورك، باقاتك، وبيانات التواصل بدون محرر معقد."
  },
  {
    icon: Images,
    title: "موقع يليق بالصور",
    body: "واجهة بسيطة تجعل أعمالك هي البطل وتعمل بسلاسة من الهاتف."
  },
  {
    icon: Sparkles,
    title: "فخامة محفوظة",
    body: "قوالب بقيود ذكية تحافظ على الشكل النظيف مهما أضفت من محتوى."
  }
];

const separationCards = [
  {
    icon: PanelsTopLeft,
    title: "لوحة المصور",
    body: "كل مصور يدخل إلى لوحة تخص موقعه فقط: الصور، الباقات، SEO، القالب، الرابط، والتفعيل."
  },
  {
    icon: Crown,
    title: "لوحة الإدارة الرئيسية",
    body: "الأدمن الرئيسي يدير المنصة والعملاء والمدفوعات والقوالب، ولا يختلط مع لوحات المصورين."
  }
];

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
        "منصة عربية تمنح المصورين مواقع احترافية بقوالب حية وروابط خاصة.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
        description: "تجربة مجانية قبل الدفع"
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

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main id="main-content">
        <section className="relative min-h-[94svh] overflow-hidden bg-ink text-white">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.42),rgba(7,7,7,.88)_72%,#070707_100%)]" />
          <div className="container-page relative flex min-h-[94svh] flex-col justify-end pb-10 pt-28 md:pb-16">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="mb-5 border-white/20 bg-white/10 text-white">
                منصة مواقع للمصورين
              </Badge>
              <h1 className="text-balance text-5xl font-semibold leading-[1.05] md:text-7xl">
                موقع مصور احترافي خلال دقائق.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                FrameID يبني للمصور حضورًا فخمًا وسريعًا: قالب حي، رابط خاص،
                لوحة تحكم بسيطة، وتجربة مجانية قبل الدفع.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink transition-[background-color] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  شاهد القوالب
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/20 px-6 text-sm font-semibold text-white transition-[background-color,border-color] hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  ابدأ التجربة المجانية
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/72">
                {trustSignals.map((signal) => (
                  <span key={signal} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-t border-white/18 pt-4 text-white"
                >
                  <div className="text-3xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-champagne-strong">
              كل شيء قليل، لكن مضبوط
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              موقع جاهز للعميل، ولوحة سهلة للمصور.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {productPillars.map((pillar) => (
              <Card key={pillar.title}>
                <CardHeader>
                  <pillar.icon className="mb-4 size-5 text-champagne-strong" />
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {pillar.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-ink py-14 text-white md:py-24">
          <div className="container-page">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="border-white/15 bg-white/10 text-white">
                رحلة المستخدم
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold md:text-5xl">
                من قالب حي إلى موقع مستقل ولوحة تحكم.
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-white/68">
                FrameID لا يبيع صفحة جاهزة فقط؛ هو ينشئ للمصور هوية رقمية
                قابلة للإدارة من أول تسجيل.
              </p>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {onboardingJourney.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-4"
                >
                  <span className="text-sm font-semibold text-champagne">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/60">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                فصل الصلاحيات
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                لوحة المصور ليست لوحة الأدمن.
              </h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                المصور يدير موقعه فقط، بينما الأدمن الرئيسي يدير منصة FrameID
                بالكامل: العملاء، المواقع، القوالب، المدفوعات، والإعدادات.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {separationCards.map((card) => (
                <Card key={card.title} className="bg-surface">
                  <CardHeader>
                    <card.icon className="mb-4 size-5 text-champagne-strong" aria-hidden />
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-muted-foreground">
                    {card.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-5">
              <h3 className="font-semibold">ماذا يتحكم فيه المصور؟</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {photographerControls.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-success" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-5">
              <h3 className="font-semibold">ماذا يدير الأدمن؟</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {adminControls.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-champagne-strong" aria-hidden />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-14 md:py-24">
          <div className="container-page">
            <p className="text-sm font-semibold text-champagne-strong text-center">
              آراء المصورين
            </p>
            <h2 className="mt-3 text-center text-3xl font-semibold md:text-5xl">
              ماذا يقول من جرب FrameID؟
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <article
                  key={t.name}
                  className="rounded-[var(--radius-card)] border border-border bg-card p-6"
                >
                  <div className="flex gap-1" aria-label="تقييم ٥ نجوم">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-champagne text-champagne" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-7 text-muted-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-4 border-t border-border pt-4">
                    <span className="text-sm font-semibold">{t.name}</span>
                    <span className="mr-2 text-sm text-muted-foreground">{t.role}</span>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="text-center text-sm font-semibold text-champagne-strong">
              أسئلة شائعة
            </p>
            <h2 className="mt-3 text-center text-3xl font-semibold md:text-5xl">
              إجابات سريعة لأسئلتك
            </h2>
            <div className="mt-8 space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-[var(--radius-card)] border border-border bg-card"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm font-semibold transition hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden>
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
        </section>

        <section className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
          <div className="container-page flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold">جرب FrameID مجانًا</span>
            <Link
              href="/signup"
              className="mr-auto inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
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
