import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import { ArrowLeft, ChevronDown, CreditCard, ExternalLink, MessageCircle, Palette, Sparkles, Star, Zap } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { TemplateLivePreview } from "@/components/themes/template-live-preview";
import { getContent } from "@/lib/content";
import { cn } from "@/lib/utils/cn";
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

              {/* CTA */}
              <a
                href="#templates-grid"
                className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-champagne/[0.08] px-5 py-2 text-[0.82rem] font-semibold text-champagne backdrop-blur-sm transition-all duration-300 hover:border-champagne/60 hover:bg-champagne/[0.14] hover:text-champagne md:mt-9"
              >
                شوف القوالب
                <ChevronDown className="size-3.5" />
              </a>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 md:mt-14 md:gap-x-10">
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-champagne/60" />
                  <span className="text-[0.75rem] font-medium text-white/45">جاهز خلال دقائق</span>
                </div>
                <div className="hidden h-3.5 w-px bg-white/10 md:block" />
                <div className="flex items-center gap-2">
                  <Palette className="size-3.5 text-champagne/60" />
                  <span className="text-[0.75rem] font-medium text-white/45">عدّل كل حاجة</span>
                </div>
                <div className="hidden h-3.5 w-px bg-white/10 md:block" />
                <div className="flex items-center gap-2">
                  <CreditCard className="size-3.5 text-champagne/60" />
                  <span className="text-[0.75rem] font-medium text-white/45">ابدأ مجانًا</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Templates Grid */}
        <section id="templates-grid" className="container-page -mt-10 pb-24 md:-mt-16 md:pb-32">
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
              {templates.map((template) => {
                const meta = templateHighlights[template.code] ?? {};
                const description = meta.highlight ?? template.description;

                return (
                  <article
                    key={template.code}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-3xl shadow-sm transition-all duration-500 hover:-translate-y-1",
                      template.themeCode === "noir-gold"
                        ? "border border-amber-900/30 bg-[#0a0a0a] hover:border-champagne/40 hover:shadow-[0_32px_64px_-12px_rgb(10,10,10,0.4),0_0_0_1px_rgb(201,169,110,0.2)]"
                        : "border border-champagne/25 bg-[#fdf9f6] hover:border-champagne/40 hover:shadow-[0_32px_64px_-12px_rgb(10,10,10,0.08),0_0_0_1px_rgb(201,169,110,0.12)]"
                    )}
                  >
                    {/* Preview */}
                    <div className="relative">
                      <Link href={`/templates/${template.code}/preview`}>
                        <TemplateLivePreview template={template} />
                      </Link>

                      {meta.badge && (
                        <span className="absolute end-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-[0.65rem] font-bold tracking-wide text-champagne shadow-lg backdrop-blur-md">
                          <Star className="size-3 fill-champagne" aria-hidden />
                          {meta.badge}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("flex flex-1 flex-col px-5 pt-2 pb-4 md:px-6 md:pt-3 md:pb-5",
                      template.themeCode === "noir-gold" ? "bg-[#0c0c0c] text-white" : "bg-[#fdf9f6] text-foreground"
                    )}>
                      <div className="flex-1">
                        <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight md:text-[1.1rem]">
                          {template.name}
                        </h3>
                        <p className={cn("mt-1.5 text-[0.88rem] leading-[1.8]",
                          template.themeCode === "noir-gold" ? "text-white/60" : "text-foreground/65"
                        )}>
                          {description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className={cn("mt-3 flex flex-col gap-2.5 border-t pt-3",
                        template.themeCode === "noir-gold" ? "border-white/15" : "border-border/25"
                      )}>
                        <Link
                          href={`/templates/${template.code}/preview`}
                          className={cn(
                            "group/btn inline-flex min-h-[3.1rem] items-center justify-center gap-2.5 rounded-xl px-5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2",
                            template.themeCode === "noir-gold"
                              ? "bg-champagne text-ink shadow-[0_4px_16px_-2px_rgba(201,169,110,0.3)] hover:bg-champagne/90 hover:shadow-[0_8px_24px_-4px_rgba(201,169,110,0.4)] active:shadow-[0_2px_8px_-2px_rgba(201,169,110,0.3)] focus-visible:ring-champagne/40"
                              : "bg-ink text-white shadow-[0_4px_16px_-2px_rgba(10,10,10,0.25)] hover:bg-ink/90 hover:shadow-[0_8px_24px_-4px_rgba(10,10,10,0.35)] active:shadow-[0_2px_8px_-2px_rgba(10,10,10,0.3)] focus-visible:ring-ink/40"
                          )}
                        >
                          <ExternalLink className="size-4 transition-transform duration-300 group-hover/btn:-rotate-12" aria-hidden />
                          <span className="md:hidden">شوف شكل الموقع ع الفون</span>
                          <span className="hidden md:inline">شوف شكل الموقع الحقيقي</span>
                          <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover/btn:-translate-x-1" aria-hidden />
                        </Link>
                        <Link
                          href={`/signup?template=${template.code}`}
                          className={cn(
                            "group/btn relative inline-flex min-h-[3.1rem] items-center justify-center gap-2.5 overflow-hidden rounded-xl px-5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2",
                            template.themeCode === "noir-gold"
                              ? "border-2 border-white/30 bg-gradient-to-l from-white/[0.12] to-white/[0.04] text-white hover:border-white/50 hover:from-white/[0.18] hover:to-white/[0.08] hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.25)] focus-visible:ring-white/40"
                              : "border-2 border-champagne/50 bg-gradient-to-l from-champagne/[0.12] to-champagne/[0.04] text-champagne-strong hover:border-champagne/80 hover:from-champagne/[0.18] hover:to-champagne/[0.08] hover:shadow-[0_8px_24px_-8px_rgba(201,169,110,0.4)] focus-visible:ring-champagne/40"
                          )}
                        >
                          <span className={cn(
                            "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 group-hover/btn:translate-x-full",
                            template.themeCode === "noir-gold" ? "via-white/15" : "via-champagne/15"
                          )} />
                          استخدم الموقع ده
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
