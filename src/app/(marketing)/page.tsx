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
          description: "تجربة مجانية ١٤ يوم من غير بطاقة بنكية"
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
              <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
                <Link
                  href={hero.cta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-7 text-sm font-semibold text-ink transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-champagne/90 hover:shadow-[0_12px_35px_rgba(230,196,120,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                >
                  {hero.cta.label}
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {hero.secondaryCta.label}
                  <ArrowLeft className="size-4" aria-hidden />
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
                    href={`/templates/${featuredTemplate.code}/preview`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background shadow-soft transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    ادخل شوفه
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
                        شوف القالب
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

        <section className="relative overflow-hidden bg-ink py-10 text-white md:py-22">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne/60 to-transparent" aria-hidden />
          <div className="absolute -right-24 top-12 size-72 rounded-full bg-champagne/10 blur-3xl" aria-hidden />
          <div className="container-page relative">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-champagne">
                مش مجرد موقع
              </p>
              <h2 className="mt-2 text-balance text-2xl font-semibold md:text-5xl">
                خلّي العميل يفهم شغلك ويطلبك أسرع
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/62 md:text-base md:leading-8">
                بدل ما تشرح كل حاجة في الشات، خلي الرابط يبيع شغلك ويجاوب العميل قبل ما يسأل.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-8 lg:grid-cols-5">
              {benefits.map((card: { title: string; body: string }, index: number) => {
                const BenefitIcon = benefitIcons[index % benefitIcons.length];
                return (
                  <article
                    key={card.title}
                    className="group grid min-h-[10.5rem] content-start rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:-translate-y-1 hover:border-champagne/30 hover:bg-white/[0.07] hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                  >
                    <span className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl border border-champagne/18 bg-champagne/12 text-champagne shadow-[0_0_22px_rgba(230,196,120,0.12)] transition group-hover:bg-champagne/18 group-hover:shadow-[0_0_28px_rgba(230,196,120,0.22)]">
                      <BenefitIcon className="size-4" aria-hidden />
                    </span>
                    <h3 className="text-base font-semibold leading-6 text-white">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      {card.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(230,196,120,0.16),transparent_32%),linear-gradient(180deg,#fffaf0_0%,#f7f2e8_100%)] py-10 md:py-22">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-champagne-strong/50 to-transparent" aria-hidden />
          <div className="container-page relative">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-champagne-strong">
                البداية أسهل من ما تتخيل
              </p>
              <h2 className="mt-2 text-balance text-2xl font-semibold text-ink md:text-5xl">
                ابدأ موقعك في ٤ خطوات بسيطة
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
                اختار الشكل، اعمل حسابك، ادخل لوحة التحكم، وعدّل موقعك في أي وقت.
              </p>
            </div>
            <div className="mt-7 grid gap-3 md:mt-10 md:grid-cols-4">
              {howItWorks.map((step: { title: string; body: string; href?: string }, index: number) => {
                const JourneyIcon = journeyIcons[index % journeyIcons.length];
                const href = step.href ?? journeyFallbackHrefs[index] ?? "/templates";
                return (
                  <Link
                    key={step.title}
                    href={href}
                    className="group relative grid min-h-[12rem] overflow-hidden rounded-[1.45rem] border border-ink/10 bg-white/82 p-4 text-start no-underline shadow-[0_18px_45px_rgba(20,20,20,0.08),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur transition active:scale-[0.98] hover:-translate-y-1 hover:border-champagne-strong/35 hover:bg-white hover:shadow-[0_24px_60px_rgba(20,20,20,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-strong md:p-5"
                  >
                    <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-champagne-strong/60 to-transparent opacity-70" aria-hidden />
                    <span className="mb-5 flex items-center justify-between gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-champagne-strong/18 bg-champagne-strong/10 text-champagne-strong shadow-[0_0_24px_rgba(181,137,61,0.16)] transition group-hover:bg-champagne-strong/15 group-hover:shadow-[0_0_30px_rgba(181,137,61,0.26)]">
                        <JourneyIcon className="size-5" aria-hidden />
                      </span>
                      <span className="inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-ink text-white shadow-soft transition group-hover:-translate-x-1 group-hover:bg-champagne-strong group-hover:text-ink">
                        <ArrowLeft className="size-4" aria-hidden />
                      </span>
                    </span>
                    <span className="mb-2 inline-flex w-fit rounded-full bg-ink/5 px-2.5 py-1 text-[0.68rem] font-semibold text-ink/55">
                      خطوة {index + 1}
                    </span>
                    <h3 className="text-base font-semibold leading-6 text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.body}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-surface py-10 md:py-22">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <p className="text-center text-sm font-semibold text-champagne-strong">
                {trustSection.badge}
              </p>
              <h2 className="text-center text-2xl font-semibold md:text-5xl">
                {trustSection.title}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-muted-foreground md:mt-4 md:text-base md:leading-7">
                {trustSection.message}
              </p>
              <div className="mt-6 space-y-2 md:mt-8 md:space-y-3">
                {faq.items.map((item: { question: string; answer: string }) => (
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
          </div>
        </section>

        <section className="bg-ink py-14 text-white md:py-22">
          <div className="container-page text-center">
            <h2 className="text-balance text-2xl font-semibold md:text-5xl">
              {finalCta.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/65 md:mt-4 md:text-base md:leading-8">
              {finalCta.subtext}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 md:mt-8 md:flex-row">
              <Link
                href={finalCta.cta.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-7 text-sm font-semibold text-ink transition-[background-color] hover:bg-champagne/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
              >
                {finalCta.cta.label}
              </Link>
            </div>
          </div>
        </section>

        <section className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md md:hidden">
          <div className="container-page flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold">{mobileStickyCta.label}</span>
            <Link
              href={mobileStickyCta.href}
              className="mr-auto inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              {mobileStickyCta.buttonText}
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
