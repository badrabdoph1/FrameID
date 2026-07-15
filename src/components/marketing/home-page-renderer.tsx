import Image from "next/image";
import Link from "next/link";
import { memo, type ReactNode } from "react";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";

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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.78)_0%,rgba(7,7,7,.58)_45%,rgba(7,7,7,.92)_100%)]" />
      <div className="container-page relative z-10 flex flex-col items-center py-28 text-center md:py-36">
        <p className="mb-6 text-[0.65rem] font-bold tracking-[0.2em] text-champagne/90 uppercase md:text-xs md:tracking-[0.25em]">
          <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
        </p>
        <h1 className="max-w-[16ch] text-balance text-[clamp(2.4rem,7vw,6rem)] font-semibold leading-[1.04] tracking-[-0.025em]">
          <Text field={{ sectionId, path: ["headline"], value: content.headline }} render={renderText} />{" "}
          <span className="text-champagne">
            <Text
              field={{ sectionId, path: ["headlineHighlight"], value: content.headlineHighlight }}
              render={renderText}
            />
          </span>
        </h1>
        <p className="mt-6 max-w-[44ch] text-balance text-[0.9rem] leading-[1.7] text-white/65 md:mt-7 md:text-lg md:leading-[1.75]">
          <Text
            field={{ sectionId, path: ["subheadline"], value: content.subheadline, multiline: true }}
            render={renderText}
          />
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={content.cta.href}
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
          <div className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
            {content.trustPoints.slice(0, 3).map((point, index) => (
              <span key={`${point.text}-${index}`} className="inline-flex items-center gap-2 text-[0.68rem] font-medium tracking-wide text-white/40 md:text-xs">
                <Check className="size-3.5 text-champagne/80" aria-hidden />
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
    <section data-page-section={sectionId} data-page-section-type="home.templates" className="bg-surface py-16 md:py-24">
      <div className="container-page flex flex-col items-center gap-10 text-center md:gap-12">
        <header className="max-w-lg">
          <p className="text-[0.65rem] font-bold tracking-[0.2em] text-champagne-strong/85 uppercase md:text-xs md:tracking-[0.22em]">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-4 text-balance text-[1.6rem] font-semibold leading-[1.15] text-ink md:text-[2.5rem] md:leading-[1.1]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 max-w-[50ch] text-sm leading-[1.75] text-muted-foreground md:text-base md:leading-[1.8]">
            <Text
              field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }}
              render={renderText}
            />
          </p>
        </header>
        {featuredTemplate ? (
          <Link
            href={featuredTemplate.href}
            className="group block w-full max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-white text-ink no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-ink/10"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted/40 md:aspect-[16/10]">
              <Image src={featuredTemplate.image} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/50 p-5 md:p-6">
              <div className="text-start">
                <h3 className="text-base font-semibold md:text-lg">{featuredTemplate.name}</h3>
                <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm md:leading-6">{featuredTemplate.description}</p>
              </div>
              <ArrowLeft className="size-4 shrink-0 text-champagne-strong transition-transform duration-300 group-hover:-translate-x-1.5" aria-hidden />
            </div>
          </Link>
        ) : (
          <div className="grid min-h-48 w-full max-w-xl place-items-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            ستظهر هنا معاينة القالب المنشور.
          </div>
        )}
      </div>
    </section>
  );
}

function HomeBenefits({ sectionId, content, renderText }: SectionEditingProps & { content: HomeBenefitsContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.benefits" className="border-y border-border/60 bg-background py-16 md:py-24">
      <div className="container-page">
        <header className="mx-auto max-w-lg text-center">
          <h2 className="text-balance text-[1.6rem] font-semibold leading-[1.2] text-ink md:text-[2.5rem] md:leading-[1.15]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 text-sm leading-[1.75] text-muted-foreground md:text-base md:leading-[1.8]">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mx-auto mt-12 max-w-2xl md:mt-16">
          {content.items.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={`flex items-start gap-5 py-7 md:gap-6 md:py-9 ${index > 0 ? "border-t border-border/50" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne/12 text-[0.7rem] font-bold tabular-nums text-champagne-strong md:h-10 md:w-10 md:text-xs">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[0.95rem] font-semibold leading-[1.4] text-ink md:text-base">
                  <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                </h3>
                <p className="mt-1.5 text-[0.82rem] leading-[1.7] text-muted-foreground md:text-sm md:leading-[1.75]">
                  <Text
                    field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                    render={renderText}
                  />
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeJourney({ sectionId, content, renderText }: SectionEditingProps & { content: HomeJourneyContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.journey" className="bg-surface py-16 md:py-24">
      <div className="container-page">
        <header className="mx-auto max-w-lg text-center">
          <h2 className="text-[1.6rem] font-semibold leading-[1.2] text-ink md:text-[2.5rem] md:leading-[1.15]">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 text-sm leading-[1.75] text-muted-foreground md:text-base md:leading-[1.8]">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:mt-16 md:grid-cols-3 md:gap-5">
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
              className={journeyCardClasses(item.style ?? "secondary")}
            >
              <div className="flex w-full flex-col gap-4 md:gap-5">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-white md:h-10 md:w-10 md:text-xs">
                    {index + 1}
                  </span>
                  <span className="h-px flex-1 bg-border/60" />
                </div>
                <div className="text-start">
                  <strong className="block text-[0.95rem] font-semibold leading-[1.4] md:text-base">
                    <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                  </strong>
                  <span className={`mt-2 block text-[0.8rem] leading-[1.7] ${item.style === "primary" ? "text-white/60" : "text-muted-foreground"} md:text-sm md:leading-[1.75]`}>
                    <Text
                      field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                      render={renderText}
                    />
                  </span>
                </div>
              </div>
            </Link>
          ))}
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

function journeyCardClasses(style: "primary" | "secondary" | "quiet"): string {
  const base = "group flex min-h-[10rem] flex-col justify-between rounded-2xl border p-5 no-underline transition-all duration-200 hover:-translate-y-0.5 md:min-h-[11rem] md:p-6";
  if (style === "primary") return `${base} border-ink bg-ink text-white hover:shadow-lg hover:shadow-ink/10`;
  if (style === "quiet") return `${base} border-border/60 bg-transparent text-ink hover:border-champagne/40 hover:bg-champagne/5`;
  return `${base} border-border/60 bg-white text-ink hover:border-champagne/40 hover:shadow-md hover:shadow-ink/5`;
}

function ButtonIcon({ icon }: { icon: "arrow" | "external" | "none" }) {
  if (icon === "none") return null;
  return icon === "external"
    ? <ExternalLink className="size-3.5" aria-hidden />
    : <ArrowLeft className="size-4" aria-hidden />;
}
