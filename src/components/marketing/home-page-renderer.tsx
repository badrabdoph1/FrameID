import Image from "next/image";
import Link from "next/link";
import { memo, type ReactNode } from "react";
import { ArrowLeft, BadgeCheck, Check, ExternalLink, Link2, Sparkles, WandSparkles } from "lucide-react";

import { getVisibleSections, type PlatformPageDocument } from "@/modules/platform-pages/page-document";
import {
  parseHomeSectionContent,
  type HomeBenefitsContent,
  type HomeFaqContent,
  type HomeFinalCtaContent,
  type HomeHeroContent,
  type HomeJourneyContent,
  type HomeImageReference,
  type HomeTemplatesContent,
} from "@/modules/platform-pages/home-page-content";

export type EditableTextField = {
  sectionId: string;
  path: Array<string | number>;
  value: string;
  multiline?: boolean;
};

export type EditableImageField = {
  sectionId: string;
  path: Array<string | number>;
  value: string;
  alt: string;
  reference: HomeImageReference;
};

export type FeaturedTemplatePreview = {
  name: string;
  description: string;
  image: string;
  href: string;
};

type HomePageRendererProps = {
  document: PlatformPageDocument;
  featuredTemplate?: FeaturedTemplatePreview | null;
  renderText?: (field: EditableTextField) => ReactNode;
  renderImage?: (field: EditableImageField, image: ReactNode) => ReactNode;
};

export function HomePageRenderer({
  document,
  featuredTemplate,
  renderText,
  renderImage,
}: HomePageRendererProps) {
  return (
    <main id="main-content" className="bg-surface">
      {getVisibleSections(document).map((section) => (
        <HomeSection
          key={section.id}
          section={section}
          featuredTemplate={featuredTemplate}
          renderText={renderText}
          renderImage={renderImage}
        />
      ))}
    </main>
  );
}

const HomeSection = memo(function HomeSection({
  section,
  featuredTemplate,
  renderText,
  renderImage,
}: {
  section: PlatformPageDocument["sections"][number];
  featuredTemplate?: FeaturedTemplatePreview | null;
  renderText?: HomePageRendererProps["renderText"];
  renderImage?: HomePageRendererProps["renderImage"];
}) {
  const parsed = parseHomeSectionContent(section);

  switch (parsed.type) {
    case "home.hero":
      return <HomeHero sectionId={section.id} content={parsed.content} renderText={renderText} renderImage={renderImage} />;
    case "home.templates":
      return <HomeTemplates sectionId={section.id} content={parsed.content} featuredTemplate={featuredTemplate} renderText={renderText} />;
    case "home.benefits":
      return <HomeBenefits sectionId={section.id} content={parsed.content} renderText={renderText} />;
    case "home.journey":
      return <HomeJourney sectionId={section.id} content={parsed.content} renderText={renderText} />;
    case "home.faq":
      return <HomeFaq sectionId={section.id} content={parsed.content} renderText={renderText} />;
    case "home.final-cta":
      return <HomeFinalCta sectionId={section.id} content={parsed.content} renderText={renderText} />;
  }
});

type SectionEditingProps = {
  sectionId: string;
  renderText?: HomePageRendererProps["renderText"];
};

function HomeHero({
  sectionId,
  content,
  renderText,
  renderImage,
}: SectionEditingProps & {
  content: HomeHeroContent;
  renderImage?: HomePageRendererProps["renderImage"];
}) {
  const imageUrl = typeof content.heroImage === "string" ? content.heroImage : content.heroImage.url;
  const imageAlt = typeof content.heroImage === "string" ? "" : (content.heroImage.alt ?? "");
  const image = (
    <Image
      src={imageUrl}
      alt={imageAlt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
  );

  return (
    <section
      data-page-section={sectionId}
      data-page-section-type="home.hero"
      className="relative isolate flex min-h-[92dvh] items-center overflow-hidden bg-ink text-white md:min-h-screen"
    >
      {renderImage
        ? renderImage({ sectionId, path: ["heroImage"], value: imageUrl, alt: "صورة القسم الرئيسي", reference: content.heroImage }, image)
        : image}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.82)_0%,rgba(5,5,5,.48)_40%,rgba(5,5,5,.52)_65%,rgba(5,5,5,.95)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,transparent_60%,rgba(5,5,5,.4)_100%)]" />
      <div className="container-page relative z-10 flex flex-col items-center py-28 text-center md:py-40">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-[0.62rem] font-semibold tracking-[0.18em] text-white/70 uppercase backdrop-blur-md md:mb-8 md:text-[0.7rem] md:tracking-[0.22em]">
          <span className="h-1 w-1 rounded-full bg-champagne" />
          <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
        </span>
        <h1 className="max-w-[18ch] text-balance text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          <Text field={{ sectionId, path: ["headline"], value: content.headline }} render={renderText} />{" "}
          <span className="text-champagne">
            <Text
              field={{ sectionId, path: ["headlineHighlight"], value: content.headlineHighlight }}
              render={renderText}
            />
          </span>
        </h1>
        <p className="mt-5 max-w-[48ch] text-pretty text-[0.88rem] leading-[1.75] text-white/55 md:mt-7 md:text-[1.05rem] md:leading-[1.8]">
          <Text
            field={{ sectionId, path: ["subheadline"], value: content.subheadline, multiline: true }}
            render={renderText}
          />
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={content.cta.href}
            data-journey-source="home-start"
            data-journey-cta
            {...buttonEditingAttributes(sectionId, ["cta"], { ...content.cta, style: content.cta.style ?? "primary", icon: content.cta.icon ?? "arrow" })}
            className={buttonClasses(content.cta.style ?? "primary")}
          >
            <Text field={{ sectionId, path: ["cta", "label"], value: content.cta.label }} render={renderText} />
            <ButtonIcon icon={content.cta.icon ?? "arrow"} />
          </Link>
          <Link
            href={content.secondaryCta.href}
            {...buttonEditingAttributes(sectionId, ["secondaryCta"], { ...content.secondaryCta, style: content.secondaryCta.style ?? "quiet", icon: content.secondaryCta.icon ?? "external" })}
            className={buttonClasses(content.secondaryCta.style ?? "quiet")}
          >
            <Text
              field={{ sectionId, path: ["secondaryCta", "label"], value: content.secondaryCta.label }}
              render={renderText}
            />
            <ButtonIcon icon={content.secondaryCta.icon ?? "external"} />
          </Link>
        </div>
        {content.trustPoints.length > 0 ? (
          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {content.trustPoints.slice(0, 3).map((point, index) => (
              <span key={`${point.text}-${index}`} className="inline-flex items-center gap-2 text-[0.65rem] font-medium tracking-[0.06em] text-white/35 md:text-[0.72rem]">
                <Check className="size-3 text-champagne/70" aria-hidden />
                <Text
                  field={{ sectionId, path: ["trustPoints", index, "text"], value: point.text }}
                  render={renderText}
                />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HomeTemplates({
  sectionId,
  content,
  featuredTemplate,
  renderText,
}: SectionEditingProps & {
  content: HomeTemplatesContent;
  featuredTemplate?: FeaturedTemplatePreview | null;
}) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.templates" className="relative bg-surface py-20 md:py-28">
      <div className="container-page">
        {/* Section Header */}
        <div className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">
            <Text
              field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }}
              render={renderText}
            />
          </p>
        </div>

        {/* Featured Template Card */}
        {featuredTemplate ? (
          <div className="mx-auto max-w-4xl">
            <Link
              href={featuredTemplate.href}
              className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/5 transition-all duration-300 hover:shadow-lg hover:ring-champagne/30"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={featuredTemplate.image}
                  alt={featuredTemplate.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/40 group-hover:opacity-100">
                  <span className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg">
                    معاينة مباشرة
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex items-center justify-between px-6 py-5 md:px-8 md:py-6">
                <div>
                  <h3 className="text-lg font-semibold text-ink md:text-xl">
                    {featuredTemplate.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {featuredTemplate.description}
                  </p>
                </div>
                <ArrowLeft className="size-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-x-1 group-hover:text-champagne" />
              </div>
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-border/50 py-16 text-center">
            <p className="text-sm text-muted-foreground">ستظهر هنا معاينة القالب المنشور.</p>
          </div>
        )}

        {/* Browse All Link */}
        <div className="mt-10 text-center md:mt-12">
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 text-sm font-medium text-champagne-strong transition-colors hover:text-champagne"
          >
            تصفّح كل القوالب
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

const benefitIcons = [BadgeCheck, Sparkles, WandSparkles, Link2] as const;

function HomeBenefits({ sectionId, content, renderText }: SectionEditingProps & { content: HomeBenefitsContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.benefits" className="border-y border-border/50 bg-background py-20 md:py-28">
      <div className="container-page">
        <header className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-[1.5rem] font-semibold leading-[1.2] text-ink md:text-[2.4rem] md:leading-[1.12]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[0.85rem] leading-[1.75] text-muted-foreground md:text-base md:leading-[1.8]">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-2 md:mt-16 md:gap-5">
          {content.items.map((item, index) => {
            const Icon = benefitIcons[index % benefitIcons.length];
            return (
              <article
                key={`${item.title}-${index}`}
                className="group relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-6 transition-all duration-200 hover:border-champagne/25 hover:shadow-[0_8px_30px_rgb(16_16_16/0.04)] md:p-7"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/[0.08] text-champagne-strong transition-colors duration-200 group-hover:bg-champagne/[0.14]">
                  <Icon className="size-[1.15rem]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[0.95rem] font-semibold leading-[1.35] text-ink md:text-base">
                    <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                  </h3>
                  <p className="mt-2 text-[0.8rem] leading-[1.75] text-muted-foreground md:text-[0.85rem] md:leading-[1.8]">
                    <Text
                      field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                      render={renderText}
                    />
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HomeJourney({ sectionId, content, renderText }: SectionEditingProps & { content: HomeJourneyContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.journey" className="bg-surface py-20 md:py-28">
      <div className="container-page">
        <header className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-[1.5rem] font-semibold leading-[1.2] text-ink md:text-[2.4rem] md:leading-[1.12]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[0.85rem] leading-[1.75] text-muted-foreground md:text-base md:leading-[1.8]">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="relative mx-auto mt-14 max-w-3xl md:mt-20">
          <div className="hidden md:block">
            <div className="absolute top-5 right-[16.67%] left-[16.67%] h-px bg-gradient-to-l from-champagne/30 via-border to-champagne/30" />
          </div>
          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
            {content.items.map((item, index) => (
              <Link
                key={`${item.title}-${index}`}
                href={item.href ?? "/templates"}
                {...buttonEditingAttributes(
                  sectionId,
                  ["items", index],
                  { label: item.title, href: item.href ?? "/templates", icon: item.icon ?? "arrow", style: item.style ?? "secondary" },
                  "title",
                )}
                className="group relative flex flex-col items-center rounded-2xl border border-border/50 bg-surface px-6 py-8 text-center no-underline transition-all duration-200 hover:border-champagne/25 hover:shadow-[0_8px_30px_rgb(16_16_16/0.04)] md:py-9"
              >
                <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-ink text-[0.75rem] font-bold tabular-nums text-white md:h-11 md:w-11 md:text-xs">
                  {index + 1}
                </span>
                <div className="mt-5">
                  <strong className="block text-[0.95rem] font-semibold leading-[1.35] text-ink md:text-base">
                    <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                  </strong>
                  <span className="mt-2 block text-[0.8rem] leading-[1.75] text-muted-foreground md:text-[0.85rem] md:leading-[1.8]">
                    <Text
                      field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                      render={renderText}
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFaq({ sectionId, content, renderText }: SectionEditingProps & { content: HomeFaqContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.faq" className="bg-ink py-16 text-white md:py-24">
      <div className="container-page mx-auto max-w-3xl">
        <header className="mb-10 text-center md:mb-12">
          <p className="text-[0.65rem] font-bold tracking-[0.2em] text-champagne/90 uppercase md:text-xs md:tracking-[0.22em]">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-4 text-balance text-[1.6rem] font-semibold leading-[1.2] md:text-[2.5rem] md:leading-[1.15]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
        </header>
        <div className="border-t border-white/12">
          {content.items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b border-white/8">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start [&::-webkit-details-marker]:hidden md:py-6">
                <span className="text-[0.9rem] font-semibold leading-[1.5] md:text-base md:leading-[1.55]">
                  <Text
                    field={{ sectionId, path: ["items", index, "question"], value: item.question }}
                    render={renderText}
                  />
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-lg text-champagne/80 transition-all duration-200 group-open:rotate-45 group-open:bg-champagne/20" aria-hidden>
                  +
                </span>
              </summary>
              <div className="overflow-hidden pb-5 transition-all duration-200 md:pb-6">
                <p className="text-[0.82rem] leading-[1.75] text-white/55 md:text-sm md:leading-[1.8]">
                  <Text
                    field={{ sectionId, path: ["items", index, "answer"], value: item.answer, multiline: true }}
                    render={renderText}
                  />
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeFinalCta({ sectionId, content, renderText }: SectionEditingProps & { content: HomeFinalCtaContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.final-cta" className="bg-surface py-8 md:py-12">
      <div className="container-page">
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-ink px-7 py-8 text-center text-white md:flex-row md:justify-between md:px-12 md:py-10 md:text-start">
          <div className="max-w-xl">
            <h2 className="text-[1.3rem] font-semibold leading-[1.25] md:text-2xl md:leading-[1.2]">
              <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
            </h2>
            <p className="mt-3 text-[0.82rem] leading-[1.7] text-white/55 md:text-sm md:leading-[1.75]">
              <Text
                field={{ sectionId, path: ["subtext"], value: content.subtext, multiline: true }}
                render={renderText}
              />
            </p>
          </div>
          <Link href={content.cta.href} {...buttonEditingAttributes(sectionId, ["cta"], { ...content.cta, style: content.cta.style ?? "primary", icon: content.cta.icon ?? "arrow" })} className={`${buttonClasses(content.cta.style ?? "primary")} shrink-0`}>
            <Text field={{ sectionId, path: ["cta", "label"], value: content.cta.label }} render={renderText} />
            <ButtonIcon icon={content.cta.icon ?? "arrow"} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Text({ field, render }: { field: EditableTextField; render?: HomePageRendererProps["renderText"] }) {
  const path = field.path.join(".");
  return (
    <span data-page-field={path} data-page-section-id={field.sectionId}>
      {render ? render(field) : field.value}
    </span>
  );
}

function buttonEditingAttributes(
  sectionId: string,
  path: Array<string | number>,
  button: { label: string; href: string; icon?: "arrow" | "external" | "none"; style?: "primary" | "secondary" | "quiet" },
  labelField = "label",
) {
  return {
    "data-page-button": "true",
    "data-page-button-section": sectionId,
    "data-page-button-path": path.join("."),
    "data-page-button-label": button.label,
    "data-page-button-href": button.href,
    "data-page-button-icon": button.icon ?? "arrow",
    "data-page-button-style": button.style ?? "primary",
    "data-page-button-label-field": labelField,
  };
}

function buttonClasses(style: "primary" | "secondary" | "quiet"): string {
  const base = "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-7 text-[0.85rem] font-semibold no-underline transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";
  if (style === "secondary") return `${base} border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/18`;
  if (style === "quiet") return `${base} px-4 text-white/70 hover:text-white`;
  return `${base} bg-champagne text-ink shadow-lg shadow-champagne/20 hover:bg-champagne/90 hover:shadow-xl hover:shadow-champagne/30`;
}


function ButtonIcon({ icon }: { icon: "arrow" | "external" | "none" }) {
  if (icon === "none") return null;
  return icon === "external"
    ? <ExternalLink className="size-3.5" aria-hidden />
    : <ArrowLeft className="size-4" aria-hidden />;
}
