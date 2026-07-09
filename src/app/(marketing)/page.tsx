import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BadgeDollarSign,
  CheckCircle2,
  Eye,
  HelpCircle,
  Images,
  LayoutDashboard,
  Link2,
  LogIn,
  MessageCircle,
  Palette,
  PencilLine,
  Share2,
  Smartphone,
  UserPlus,
  WandSparkles
} from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getContent } from "@/lib/content";

const benefitIcons = [
  BadgeDollarSign,
  Images,
  Link2,
  PencilLine,
  MessageCircle,
  BadgeCheck,
  AtSign,
  HelpCircle,
  Smartphone,
  Share2
];

const journeyIcons = [Palette, UserPlus, LayoutDashboard, LogIn];
const journeyFallbackHrefs = ["/templates", "/signup", "/dashboard", "/login"];

export default function HomePage() {
  const homepage = getContent("marketing/homepage");
  const faq = getContent("marketing/faq");
  const nav = getContent("marketing/navigation");
  const templates = getPublishedTemplates();
  const previewTemplates = templates.slice(0, 1);
  const featuredTemplate = previewTemplates[0];
  const { hero, benefits, howItWorks, templateSection, trustSection, finalCta, mobileStickyCta } = homepage;
  const featuredPreviewHref = featuredTemplate ? `/templates/${featuredTemplate.code}/preview` : hero.secondaryCta.href;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "FrameID",
        url: "https://frameid.app"
      },
      {
        "@type": "WebSite",
        name: "FrameID",
        url: "https://frameid.app",
        inLanguage: "ar"
      },
      {
        "@type": "SoftwareApplication",
        name: "FrameID",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://frameid.app",
        description: "منصة بتقدم للمصورين مواقع احترافية بقوالب جاهزة وروابط خاصة.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EGP",
          description: "تجربة مجانية"
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.items.map((item: { question: string; answer: string }) => ({
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

  return (
    <>
      <MarketingNav links={nav.links} />
      <main id="main-content">
        <section className="relative min-h-[90dvh] overflow-hidden bg-ink text-white">
          <Image
            src={hero.heroImage}
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
                {hero.badge}
              </Badge>
              <h1 className="text-balance text-[clamp(2rem,5.4vw,4.6rem)] font-semibold leading-[1.08]">
                {hero.headline}
                <br />
                <span className="text-champagne drop-shadow-[0_0_24px_rgba(230,196,120,0.28)]">{hero.headlineHighlight}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 md:mt-5 md:text-lg md:leading-8">
                {hero.subheadline}
              </p>
              <div className="mt-6 flex flex-col items-start gap-2 md:mt-8">
                <Link
                  href={hero.cta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-8 text-sm font-semibold text-ink transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-champagne/90 hover:shadow-[0_12px_35px_rgba(230,196,120,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                >
                  {hero.cta.label}
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link
                  href={featuredPreviewHref}
                  className="inline-flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-white/70 underline-offset-4 transition hover:text-champagne hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne md:text-sm"
                >
                  {hero.secondaryCta.label}
                  <ArrowLeft className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="mt-7 max-w-3xl rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.055] p-3 shadow-[0_0_45px_rgba(230,196,120,0.14)] backdrop-blur md:mt-8 md:p-4">
                <p className="mb-3 text-xs font-semibold text-champagne">
                  كل اللي محتاجه موقعك في مكان واحد
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {hero.trustPoints.map((point: { text: string }, i: number) => (
                    <span
                      key={i}
                      className="group inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-xs font-semibold text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-champagne/40 hover:bg-champagne/10 hover:text-white"
                    >
                      <CheckCircle2 className="size-3.5 shrink-0 text-champagne drop-shadow-[0_0_10px_rgba(230,196,120,0.55)]" aria-hidden />
                      {point.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-10 md:py-22">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-champagne-strong">
                {templateSection.badge}
              </p>
              <h2 className="mt-2 text-2xl font-semibold md:text-5xl">
                {templateSection.title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:mt-4 md:text-base md:leading-7">
                {templateSection.subtitle}
              </p>
              {featuredTemplate ? (
                <div className="mt-5">
                  <Link
                    href={featuredPreviewHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background shadow-soft transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    شوف مثال لموقع مصور
                    <ArrowLeft className="size-4" aria-hidden />
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="mx-auto mt-6 grid max-w-3xl gap-6 md:mt-8">
              {previewTemplates.map((template) => (
                <article
                  key={template.code}
                  className="group overflow-hidden rounded-[var(--radius-panel)] border border-border bg-white shadow-soft transition hover:shadow-champagne"
                >
                  <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
                    <span className="size-2.5 rounded-full bg-danger/70" />
                    <span className="size-2.5 rounded-full bg-warning/70" />
                    <span className="size-2.5 rounded-full bg-success/70" />
                    <span className="mr-3 text-[11px] text-muted-foreground md:text-xs">
                      frameid.app/p/اسمك
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={getTemplatePreviewImage(template)}
                      alt={`معاينة قالب ${template.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                      <Link
                        href={`/templates/${template.code}/preview`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-2 md:px-4 md:py-2 md:text-sm"
                      >
                        <Eye className="size-3.5 md:size-4" aria-hidden />
                        شوف المثال
                      </Link>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/signup?template=${template.code}`}
                        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <WandSparkles className="size-4" aria-hidden />
                        استخدم القالب ده
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-ink py-8 text-white md:py-22">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne/60 to-transparent" aria-hidden />
          <div className="absolute -right-24 top-12 hidden size-72 rounded-full bg-champagne/10 blur-3xl md:block" aria-hidden />
          <div className="container-page relative">
            <div className="mx-auto max-w-xl text-center md:mx-0 md:max-w-2xl md:text-start">
              <p className="text-xs font-semibold text-champagne md:text-sm">
                مش مجرد موقع
              </p>
              <h2 className="mt-2 text-balance text-xl font-semibold leading-tight md:text-5xl">
                خلّي العميل يفهم شغلك ويطلبك أسرع
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-white/58 md:mx-0 md:mt-3 md:text-base md:leading-8">
                بدل ما تشرح كل حاجة في الشات، خلي الرابط يبيع شغلك ويجاوب العميل قبل ما يسأل.
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 md:mt-8 md:grid-cols-3 md:gap-3 lg:grid-cols-5">
              {benefits.map((card: { title: string; body: string }, index: number) => {
                const BenefitIcon = benefitIcons[index % benefitIcons.length];
                return (
                  <article
                    key={card.title}
                    className="group grid min-h-[7.7rem] content-start rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-champagne/25 hover:bg-white/[0.06] md:min-h-[10.5rem] md:rounded-[1.35rem] md:p-4 md:hover:-translate-y-1 md:hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                  >
                    <span className="mb-2 inline-flex size-8 items-center justify-center rounded-xl border border-champagne/16 bg-champagne/10 text-champagne shadow-[0_0_16px_rgba(230,196,120,0.10)] transition group-hover:bg-champagne/14 md:mb-4 md:size-10 md:rounded-2xl md:shadow-[0_0_22px_rgba(230,196,120,0.12)]">
                      <BenefitIcon className="size-3.5 md:size-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold leading-5 text-white md:text-base md:leading-6">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-[0.72rem] leading-5 text-white/55 md:mt-2 md:text-sm md:leading-6 md:text-white/58">
                      {card.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(230,196,120,0.10),transparent_30%),linear-gradient(180deg,#fffaf0_0%,#f7f2e8_100%)] py-8 md:py-22">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne-strong/50 to-transparent" aria-hidden />
          <div className="container-page relative">
            <div className="mx-auto max-w-xl text-center md:max-w-2xl">
              <p className="text-xs font-semibold text-champagne-strong md:text-sm">
                البداية أسهل من ما تتخيل
              </p>
              <h2 className="mt-2 text-balance text-xl font-semibold text-ink md:text-5xl">
                ابدأ موقعك في ٤ خطوات بسيطة
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted-foreground md:mt-3 md:text-base md:leading-8">
                اختار الشكل، اعمل حسابك، ادخل لوحة التحكم، وعدّل موقعك في أي وقت.
              </p>
            </div>
            <div className="mt-5 grid gap-2.5 md:mt-10 md:grid-cols-4 md:gap-3">
              {howItWorks.map((step: { title: string; body: string; href?: string }, index: number) => {
                const JourneyIcon = journeyIcons[index % journeyIcons.length];
                const href = step.href ?? journeyFallbackHrefs[index] ?? "/templates";
                return (
                  <Link
                    key={step.title}
                    href={href}
                    className="group relative flex min-h-[4.8rem] items-center gap-3 overflow-hidden rounded-2xl border border-ink/10 bg-white/86 p-3 text-start no-underline shadow-[0_10px_28px_rgba(20,20,20,0.06),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur transition active:scale-[0.98] hover:border-champagne-strong/28 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-strong md:grid md:min-h-[12rem] md:content-start md:rounded-[1.45rem] md:p-5 md:hover:-translate-y-1 md:hover:shadow-[0_24px_60px_rgba(20,20,20,0.12)]"
                  >
                    <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-champagne-strong/55 to-transparent opacity-60" aria-hidden />
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-champagne-strong/16 bg-champagne-strong/10 text-champagne-strong shadow-[0_0_18px_rgba(181,137,61,0.12)] md:hidden">
                      <JourneyIcon className="size-4" aria-hidden />
                    </span>
                    <div className="mb-5 hidden items-center justify-between gap-3 md:flex">
                      <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-champagne-strong/18 bg-champagne-strong/10 text-champagne-strong shadow-[0_0_24px_rgba(181,137,61,0.16)] transition group-hover:bg-champagne-strong/15 group-hover:shadow-[0_0_30px_rgba(181,137,61,0.26)]">
                        <JourneyIcon className="size-5" aria-hidden />
                      </span>
                      <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-ink text-white shadow-soft transition group-hover:-translate-x-1 group-hover:bg-champagne-strong group-hover:text-ink">
                        <ArrowLeft className="size-4" aria-hidden />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 text-center md:text-start">
                      <span className="mb-2 hidden w-fit rounded-full bg-ink/5 px-2.5 py-1 text-[0.68rem] font-semibold text-ink/55 md:inline-flex">
                        خطوة {index + 1}
                      </span>
                      <h3 className="text-sm font-semibold leading-5 text-ink md:text-base md:leading-6">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground md:mt-2 md:text-sm md:leading-6">
                        {step.body}
                      </p>
                    </div>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-ink text-white shadow-soft transition group-hover:-translate-x-1 group-hover:bg-champagne-strong group-hover:text-ink md:hidden">
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-ink py-10 text-white md:py-22">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne/60 to-transparent" aria-hidden />
          <div className="absolute -left-24 top-10 size-72 rounded-full bg-champagne/10 blur-3xl" aria-hidden />
          <div className="absolute -right-28 bottom-0 size-80 rounded-full bg-white/5 blur-3xl" aria-hidden />
          <div className="container-page relative">
            <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-10">
              <div className="lg:sticky lg:top-24">
                <span className="inline-flex items-center gap-2 rounded-full border border-champagne/18 bg-champagne/10 px-3 py-1.5 text-xs font-semibold text-champagne shadow-[0_0_28px_rgba(230,196,120,0.12)]">
                  <HelpCircle className="size-3.5" aria-hidden />
                  {trustSection.badge}
                </span>
                <h2 className="mt-4 text-balance text-2xl font-semibold leading-tight md:text-5xl">
                  {trustSection.title}
                </h2>
              </div>
              <div className="grid gap-2.5">
                {faq.items.map((item: { question: string; answer: string }, index: number) => (
                  <details
                    key={item.question}
                    className="group overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition open:border-champagne/28 open:bg-white/[0.07] hover:border-white/18 hover:bg-white/[0.06]"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 text-start transition active:scale-[0.99] md:p-4 [&::-webkit-details-marker]:hidden">
                      <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-champagne/18 bg-champagne/10 text-xs font-semibold text-champagne shadow-[0_0_18px_rgba(230,196,120,0.12)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-6 text-white md:text-base">
                        {item.question}
                      </span>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/55 transition group-open:-rotate-90 group-open:border-champagne/24 group-open:text-champagne">
                        <ArrowLeft className="size-4" aria-hidden />
                      </span>
                    </summary>
                    <div className="border-t border-white/10 px-3 pb-4 pt-3 md:px-4">
                      <p className="text-sm leading-7 text-white/62">
                        {item.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface py-5 md:py-7">
          <div className="container-page">
            <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between md:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink md:text-2xl">
                  {finalCta.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {finalCta.subtext}
                </p>
              </div>
              <Link
                href={finalCta.cta.href}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-ink px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {finalCta.cta.label}
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="fixed inset-x-3 bottom-3 z-40 md:hidden">
          <Link
            href={mobileStickyCta.href}
            className="flex min-h-12 items-center justify-between gap-3 rounded-full border border-white/14 bg-ink/95 px-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-md transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
          >
            <span className="truncate text-xs font-semibold text-white/72">{mobileStickyCta.label}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne px-3 py-1.5 text-xs font-semibold text-ink">
              {mobileStickyCta.buttonText}
              <ArrowLeft className="size-3.5" aria-hidden />
            </span>
          </Link>
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
