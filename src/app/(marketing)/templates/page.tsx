import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ArrowLeft, CheckCircle2, Eye, LayoutTemplate, WandSparkles } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "قوالب مواقع المصورين الجاهزة",
  description: "اختار شكل موقعك من قوالب FrameID الجاهزة للمصورين، وافتح كل قالب كأنه موقع حقيقي قبل ما تبدأ.",
  alternates: {
    canonical: "/templates"
  },
  openGraph: {
    title: "قوالب مواقع المصورين الجاهزة | FrameID",
    description: "شوف أمثلة حقيقية لشكل موقع المصور، واختار القالب المناسب قبل إنشاء حسابك.",
    url: "/templates",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "قوالب مواقع المصورين الجاهزة | FrameID",
    description: "افتح أي قالب كأنه موقع حقيقي، وشوف شكله قبل ما تبدأ تعدل صورك وباقاتك."
  }
};

const selectionSteps = [
  {
    title: "شوف الشكل",
    body: "افتح القالب كأنه موقع حقيقي قبل ما تختار."
  },
  {
    title: "اختار اللي يعجبك",
    body: "اضغط استخدمه لموقعي واحفظ اختيارك."
  },
  {
    title: "كمّل حسابك",
    body: "هتدخل لوحة التحكم وتعدل الصور والباقات."
  }
];

export default function TemplatesPage() {
  const templates = getPublishedTemplates();
  const featuredTemplate = templates[0];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: "https://frameid.app/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "القوالب",
        item: "https://frameid.app/templates"
      }
    ]
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "قوالب مواقع المصورين الجاهزة",
    itemListElement: templates.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebPage",
        name: template.name,
        description: template.description,
        url: `https://frameid.app/templates/${template.code}/preview`
      }
    }))
  };

  return (
    <>
      <MarketingNav />
      <main id="main-content" className="min-h-screen bg-background pt-24">
        <section className="container-page pb-10 pt-6 md:pb-14 md:pt-12 lg:grid lg:grid-cols-[0.82fr_0.78fr] lg:items-center lg:gap-14 lg:pb-20 lg:pt-16 xl:gap-20">
          <div className="max-w-3xl">
            <Badge tone="luxury">معرض القوالب</Badge>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight text-foreground md:text-6xl lg:text-7xl lg:leading-[1.03]">
              اختار شكل موقعك
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
              افتح أي قالب كأنه موقع حقيقي، وشوف شكله قبل ما تبدأ تعدل صورك وباقاتك.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#templates-list"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-6 text-sm font-semibold text-background shadow-soft transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                شوف القوالب
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-6 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ابدأ مجانًا
              </Link>
            </div>
          </div>

          {featuredTemplate ? (
            <div className="mt-8 hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-7 rounded-[2.75rem] bg-champagne/18 blur-3xl" aria-hidden />
                <article className="relative overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_28px_90px_rgba(20,20,20,0.13)]">
                  <div className="flex items-center gap-1.5 border-b border-border bg-muted/45 px-5 py-3">
                    <span className="size-2.5 rounded-full bg-danger/70" />
                    <span className="size-2.5 rounded-full bg-warning/70" />
                    <span className="size-2.5 rounded-full bg-success/70" />
                    <span className="mr-3 truncate text-xs font-semibold text-muted-foreground">
                      مثال مباشر لموقع مصور
                    </span>
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={getTemplatePreviewImage(featuredTemplate)}
                      alt={`معاينة قالب ${featuredTemplate.name} لموقع مصور`}
                      fill
                      priority
                      sizes="520px"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/88 to-transparent p-5 text-white">
                      <p className="text-sm font-semibold text-champagne">جاهز للتجربة</p>
                      <h2 className="mt-1 text-2xl font-semibold">{featuredTemplate.name}</h2>
                    </div>
                  </div>
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <Link
                      href={`/templates/${featuredTemplate.code}/preview`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Eye className="size-4" aria-hidden />
                      شوف القالب
                    </Link>
                    <Link
                      href={`/signup?template=${featuredTemplate.code}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <WandSparkles className="size-4" aria-hidden />
                      استخدمه لموقعي
                    </Link>
                  </div>
                </article>
              </div>
            </div>
          ) : null}
        </section>

        <section className="container-page pb-8 md:pb-12">
          <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
            {selectionSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex min-h-[4.6rem] items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft/0 md:min-h-[7.5rem] md:items-start md:rounded-[var(--radius-panel)] md:p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-ink text-sm font-semibold text-white md:size-10">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground md:text-base">{step.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="templates-list" className="container-page scroll-mt-24 pb-14 md:pb-20">
          <div className="mb-5 flex flex-col gap-2 md:mb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">القوالب المتاحة</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground md:text-4xl">
                شوف الشكل واختار الأنسب
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              مفيش اختيارات معقدة. افتح القالب، شوفه، ولو مناسب ابدأ بيه.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {templates.map((template) => (
              <article
                key={template.code}
                className="group overflow-hidden rounded-[1.35rem] border border-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-champagne md:rounded-[1.75rem]"
              >
                <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/10]">
                  <Image
                    src={getTemplatePreviewImage(template)}
                    alt={`معاينة قالب ${template.name} لموقع مصور`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/78 px-3 py-1.5 text-[0.68rem] font-semibold text-white shadow-soft backdrop-blur">
                    <LayoutTemplate className="size-3.5 text-champagne" aria-hidden />
                    جاهز للتجربة
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-foreground md:text-xl">
                        {template.name}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" aria-hidden />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/templates/${template.code}/preview`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Eye className="size-4" aria-hidden />
                      شوف القالب
                    </Link>
                    <Link
                      href={`/signup?template=${template.code}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <WandSparkles className="size-4" aria-hidden />
                      استخدمه لموقعي
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface py-5 md:py-8">
          <div className="container-page">
            <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between md:p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground md:text-2xl">
                  لقيت الشكل المناسب؟
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  ابدأ مجانًا وخليه موقعك، وبعدها عدّل الصور والباقات من لوحة التحكم.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ابدأ مجانًا
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </main>
      <script
        id="frameid-templates-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="frameid-templates-item-list"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
