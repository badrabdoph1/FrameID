import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Eye, Star, WandSparkles } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { getContent } from "@/lib/content";
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

export default function TemplatesPage() {
  const templates = getPublishedTemplates();
  const footer = getContent("marketing/footer");

  const templateHighlights: Record<string, { badge?: string; highlight?: string }> = {
    "noir-gold": {
      badge: "الأكثر استخداماً",
      highlight: "مثالي لمصورين الزفاف والبورتريه اللي عايزين موقع فاخر يعكس احترافيتهم"
    },
    "rose-blush": {
      highlight: "مناسب لمصورين الخطوبة والأطفال اللي بيحبوا الستايل الناعم والعصري"
    }
  };

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
      <main id="main-content" className="min-h-screen bg-background pt-20">
        <section className="container-page pb-10 pt-8 md:pb-14 md:pt-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-champagne-strong">
              القوالب
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight text-foreground md:text-6xl lg:text-7xl lg:leading-[1.02]">
              اختار شكل موقعك
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
              قوالب جاهزة للمصورين. افتح أي قالب كأنه موقع حقيقي، وشوف شكله قبل ما تبدأ.
            </p>
          </div>
        </section>

        <section id="templates-list" className="container-page scroll-mt-24 pb-14 md:pb-20">

          {templates.length === 0 ? (
            <div className="rounded-[var(--radius-panel)] border border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
              لا توجد قوالب منشورة حاليًا.
            </div>
          ) : (
            <div
              className="grid gap-4 md:grid-cols-2 md:gap-6"
              data-smart-hint="templates-grid"
              data-journey-source="templates-grid"
            >
              {templates.map((template) => {
                const meta = templateHighlights[template.code] ?? {};
                const description = meta.highlight ?? template.description;

                return (
                  <article
                    key={template.code}
                    data-journey-card
                    className="group flex overflow-hidden rounded-[1.35rem] border border-border bg-white shadow-soft transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-champagne/45 hover:shadow-champagne md:rounded-[1.75rem]"
                  >
                    <div className="flex w-full flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                        <Image
                          src={getTemplatePreviewImage(template)}
                          alt={`معاينة قالب ${template.name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        {meta.badge ? (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ink/80 px-3 py-1.5 text-[0.68rem] font-semibold text-champagne shadow-soft backdrop-blur">
                            <Star className="size-3" aria-hidden />
                            {meta.badge}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col p-4 md:p-5">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-foreground md:text-xl">
                            {template.name}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground md:min-h-14">
                            {description}
                          </p>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <Link
                            href={`/templates/${template.code}/preview`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-foreground/90 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Eye className="size-4" aria-hidden />
                            شوف القالب
                          </Link>
                          <Link
                            href={`/signup?template=${template.code}`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-muted active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <WandSparkles className="size-4" aria-hidden />
                            استخدمه لموقعي
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <MarketingFooter content={footer} />
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
