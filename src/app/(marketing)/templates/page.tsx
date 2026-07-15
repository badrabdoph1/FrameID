import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { ArrowLeft, Eye, Sparkles, Star } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { TemplateLivePreview } from "@/components/themes/template-live-preview";
import { getContent } from "@/lib/content";
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-ink pb-20 pt-32 md:pb-28 md:pt-40">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.15),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,169,110,0.08),transparent_60%)]" />
          </div>

          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          <div className="container-page relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-5 py-2.5 text-xs font-semibold text-champagne backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                ابدأ بموقع جاهز خلال دقائق
              </div>

              {/* Title */}
              <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.1] text-white md:text-[4.5rem] md:leading-[1.05]">
                اختار شكل موقع
                <br />
                <span className="text-champagne">يناسب شخصيتك</span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-xl text-base leading-[1.8] text-white/60 md:mt-8 md:text-lg md:leading-[1.85]">
                موقعك وطريقة عرض أسعارك هما أول انطباع بياخده عميلك. ✨
                <br />
                اختار الموقع اللي يناسبك، وعدّل كل الصور والنصوص والتفاصيل براحتك بعدين.
              </p>

              {/* Stats */}
              <div className="mt-10 flex items-center justify-center gap-6 md:mt-14 md:gap-10">
                <div className="text-center">
                  <div className="text-sm font-semibold text-champagne md:text-base">✨ جاهز خلال دقائق</div>
                  <div className="mt-1 text-[0.7rem] text-white/45 md:text-xs">بضغطة واحدة</div>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-champagne md:text-base">🎨 عدّل كل حاجة</div>
                  <div className="mt-1 text-[0.7rem] text-white/45 md:text-xs">براحتك في أي وقت</div>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-champagne md:text-base">🚀 ابدأ مجانًا</div>
                  <div className="mt-1 text-[0.7rem] text-white/45 md:text-xs">بدون أي رسوم</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Templates Grid */}
        <section className="container-page -mt-10 pb-20 md:-mt-16 md:pb-28">
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50">
                <Sparkles className="size-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">لا توجد قوالب حالياً</h3>
              <p className="mt-2 text-sm text-muted-foreground">سنضيف قوالب جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {templates.map((template, index) => {
                const meta = templateHighlights[template.code] ?? {};
                const description = meta.highlight ?? template.description;

                return (
                  <article
                    key={template.code}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-champagne/40 hover:shadow-xl hover:shadow-champagne/10"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Preview Container */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-muted/20 to-transparent pb-0">
                      <Link href={`/templates/${template.code}/preview`} className="block">
                        <TemplateLivePreview template={template} />
                      </Link>

                      {/* Badge */}
                      {meta.badge && (
                        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-[0.65rem] font-bold text-champagne shadow-lg backdrop-blur-sm">
                          <Star className="size-3.5 fill-champagne" aria-hidden />
                          {meta.badge}
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/15 group-hover:opacity-100">
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className="flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-ink opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white group-hover:opacity-100"
                        >
                          <Eye className="size-4" />
                          معاينة مباشرة
                        </Link>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
                      {/* Title & Description */}
                      <div className="flex-1">
                        <h3 className="text-[0.95rem] font-semibold leading-[1.35] text-foreground md:text-base">
                          {template.name}
                        </h3>
                        <p className="mt-1.5 text-[0.78rem] leading-[1.7] text-muted-foreground md:text-sm md:leading-[1.75]">
                          {description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-4">
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[0.82rem] font-semibold text-background transition-all duration-200 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          شوف القالب
                        </Link>
                        <Link
                          href={`/signup?template=${template.code}`}
                          className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 rounded-full border border-champagne/50 bg-champagne/5 px-5 text-[0.82rem] font-semibold text-champagne-strong transition-all duration-200 hover:border-champagne hover:bg-champagne/10"
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

        {/* CTA Section */}
        <section className="border-t border-border/50 bg-surface py-20 md:py-28">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-2xl font-semibold leading-[1.2] text-foreground md:text-4xl md:leading-[1.15]">
                ما لقيت اللي يناسبك؟
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-[1.8] text-muted-foreground md:text-base md:leading-[1.85]">
                كل القوالب قابلة للتخصيص بالكامل. ابدأ بقالب قريب من ذوقك وعدّله حسب احتياجك.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink/90 md:text-base"
              >
                ابدأ مجاناً الآن
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
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
