import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { ChevronDown, CreditCard, Eye, MessageCircle, Palette, Sparkles, Star, Zap } from "lucide-react";

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
                أول انطباع لعميلك يبدأ من موقعك.
                <br />
                اختار القالب اللي يعبر عنك، وكل حاجة تتغير بعدين.
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
        <section className="container-page -mt-10 pb-24 md:-mt-16 md:pb-32">
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted/50">
                <Sparkles className="size-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">لا توجد قوالب حالياً</h3>
              <p className="mt-2 text-sm text-muted-foreground">سنضيف قوالب جديدة قريباً</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              {templates.map((template, index) => {
                const meta = templateHighlights[template.code] ?? {};
                const description = meta.highlight ?? template.description;

                return (
                  <article
                    key={template.code}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-white/80 shadow-sm ring-1 ring-black/[0.02] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-champagne/30 hover:shadow-[0_32px_64px_-12px_rgb(10,10,10,0.08),0_0_0_1px_rgb(201,169,110,0.15)]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Preview Container */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-muted/30 via-muted/10 to-transparent px-4 pt-5 pb-4">
                      <div className="relative overflow-hidden rounded-2xl shadow-[0_8px_32px_-4px_rgb(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 group-hover:shadow-[0_12px_40px_-4px_rgb(0,0,0,0.12)]">
                        <Link href={`/templates/${template.code}/preview`} className="block">
                          <TemplateLivePreview template={template} />
                        </Link>
                      </div>

                      {/* Badge */}
                      {meta.badge && (
                        <span className="absolute right-7 top-8 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3.5 py-1.5 text-[0.65rem] font-bold tracking-wide text-champagne shadow-lg backdrop-blur-md">
                          <Star className="size-3 fill-champagne" aria-hidden />
                          {meta.badge}
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-ink shadow-xl backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-2xl"
                        >
                          <Eye className="size-4" />
                          معاينة مباشرة
                        </Link>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col px-6 pt-2 pb-6">
                      {/* Title & Description */}
                      <div className="flex-1">
                        <h3 className="text-[1.05rem] font-semibold leading-[1.35] tracking-tight text-foreground md:text-[1.1rem]">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-[0.82rem] leading-[1.75] text-muted-foreground md:text-sm">
                          {description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex items-center gap-3 border-t border-border/30 pt-5">
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[0.82rem] font-semibold text-background transition-all duration-300 hover:bg-foreground/85 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                        >
                          <Eye className="size-3.5" aria-hidden />
                          شوف القالب
                        </Link>
                        <Link
                          href={`/signup?template=${template.code}`}
                          className="inline-flex min-h-[2.6rem] items-center justify-center gap-2 rounded-full border border-champagne/40 bg-champagne/[0.04] px-6 text-[0.82rem] font-semibold text-champagne-strong transition-all duration-300 hover:border-champagne/70 hover:bg-champagne/10 hover:shadow-sm"
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
                مالقتش حاجه تناسب شخصيتك؟
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-[1.8] text-muted-foreground md:text-base md:leading-[1.85]">
                اتواصل معانا ع واتساب وهنعملك تصميم مخصوص ليك انت لوحدك
              </p>
              <a
                href="https://wa.me/201038434472?text=مرحبًا،%20أحتاج%20دعم%20فني%20في%20FrameID."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-8 py-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#20bd5a] md:text-base"
              >
                <MessageCircle className="size-4" />
                الدعم الفني
              </a>
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
