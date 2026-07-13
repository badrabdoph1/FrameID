import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { Eye, WandSparkles } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { TemplateDesktopPreview } from "@/components/themes/template-desktop-preview";
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
        <section className="container-page pb-7 pt-8 md:pb-10 md:pt-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-champagne-strong">
              القوالب
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight text-foreground md:text-6xl lg:text-7xl lg:leading-[1.02]">
              اختار شكل موقعك
            </h1>
            <p className="mt-3 max-w-xl text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
              افتح القالب، شوفه، واستخدمه لموقعك.
            </p>
          </div>
        </section>

        <section id="templates-list" className="container-page scroll-mt-24 pb-14 md:pb-20">
          <div className="mb-5 flex flex-col gap-1 md:mb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                {templates.length.toLocaleString("ar-EG")} قوالب جاهزة
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground md:text-4xl">
                القوالب المتاحة
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              اختار بالعين. التفاصيل جوه المعاينة.
            </p>
          </div>

          {templates.length === 0 ? (
            <div className="rounded-[var(--radius-panel)] border border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
              لا توجد قوالب منشورة حاليًا.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {templates.map((template) => (
                <article
                  key={template.code}
                  className="group flex overflow-hidden rounded-[1.35rem] border border-border bg-white shadow-soft transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-champagne/45 hover:shadow-champagne md:rounded-[1.75rem]"
                >
                  <div className="flex w-full flex-col">
                    <div className="relative overflow-hidden bg-ink p-3 transition duration-700 group-hover:scale-[1.015] md:p-4">
                      <TemplateDesktopPreview template={template} />
                      <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-ink/78 px-3 py-1.5 text-[0.68rem] font-semibold text-white shadow-soft backdrop-blur">
                        لقطة ديسكتوب
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4 md:p-5">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground md:text-xl">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground md:min-h-14">
                          {template.description}
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
              ))}
            </div>
          )}
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
