import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Eye, Star } from "lucide-react";

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
      <main id="main-content" className="min-h-screen bg-background">
        <section className="container-page pb-12 pt-24 md:pb-16 md:pt-32">
          <div className="max-w-2xl">
            <p className="text-[0.65rem] font-bold tracking-[0.2em] text-champagne-strong/85 uppercase md:text-xs md:tracking-[0.22em]">
              القوالب
            </p>
            <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.15] text-foreground md:text-[3.2rem] md:leading-[1.1]">
              اختار شكل موقعك
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-[1.8] text-muted-foreground md:text-base md:leading-[1.85]">
              قوالب جاهزة للمصورين. افتح أي قالب كأنه موقع حقيقي، وشوف شكله قبل ما تبدأ.
            </p>
          </div>
        </section>

        <section id="templates-list" className="container-page scroll-mt-24 pb-16 md:pb-24">
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm font-medium text-muted-foreground">
              لا توجد قوالب منشورة حاليًا.
            </div>
          ) : (
            <div
              className="grid gap-5 md:grid-cols-2 md:gap-7"
            >
              {templates.map((template) => {
                const meta = templateHighlights[template.code] ?? {};
                const description = meta.highlight ?? template.description;

                return (
                  <article
                    key={template.code}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-champagne/35 hover:shadow-xl hover:shadow-ink/8 md:rounded-[1.5rem]"
                  >
                    <Link href={`/templates/${template.code}/preview`} className="block">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
                        <Image
                          src={getTemplatePreviewImage(template)}
                          alt={`معاينة قالب ${template.name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                        {meta.badge ? (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[0.65rem] font-bold text-champagne shadow-lg backdrop-blur-sm">
                            <Star className="size-3" aria-hidden />
                            {meta.badge}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-5 md:p-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold leading-[1.35] text-foreground md:text-lg">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-[0.82rem] leading-[1.7] text-muted-foreground md:text-sm md:leading-[1.75]">
                          {description}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[0.8rem] font-semibold text-background transition-all duration-200 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          شوف القالب
                        </Link>
                        <Link
                          href={`/signup?template=${template.code}`}
                          className="text-[0.8rem] font-semibold text-champagne-strong transition-colors duration-150 hover:text-champagne-strong/70"
                        >
                          استخدمه لموقعي
                        </Link>
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
