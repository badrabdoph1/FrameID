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
      className="relative isolate min-h-[88dvh] overflow-hidden bg-ink text-white"
    >
      {renderImage
        ? renderImage({ sectionId, path: ["heroImage"], value: imageUrl, alt: "صورة القسم الرئيسي", reference: content.heroImage }, image)
        : image}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,7,7,.96),rgba(7,7,7,.74)_56%,rgba(7,7,7,.42)),linear-gradient(180deg,transparent_55%,#070707)]" />
      <div className="container-page relative flex min-h-[88dvh] items-end pb-16 pt-24 md:items-center md:pb-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold text-champagne">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h1 className="max-w-[13ch] text-balance text-[clamp(2.5rem,7vw,6.2rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
            <Text field={{ sectionId, path: ["headline"], value: content.headline }} render={renderText} />{" "}
            <span className="text-champagne">
              <Text
                field={{ sectionId, path: ["headlineHighlight"], value: content.headlineHighlight }}
                render={renderText}
              />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/72 md:text-lg">
            <Text
              field={{ sectionId, path: ["subheadline"], value: content.subheadline, multiline: true }}
              render={renderText}
            />
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={content.cta.href}
              data-journey-source="home-start"
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
            <div className="mt-9 flex max-w-2xl flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/58">
              {content.trustPoints.slice(0, 4).map((point, index) => (
                <span key={`${point.text}-${index}`} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-champagne" aria-hidden />
                  <Text
                    field={{ sectionId, path: ["trustPoints", index, "text"], value: point.text }}
                    render={renderText}
                  />
                </span>
              ))}
            </div>
          ) : null}
        </div>
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
      <div className="container-page grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16">
        <header className="max-w-xl">
          <p className="text-sm font-semibold text-champagne-strong">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight text-ink md:text-5xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 max-w-[58ch] text-base leading-8 text-muted-foreground">
            <Text
              field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }}
              render={renderText}
            />
          </p>
        </header>
        {featuredTemplate ? (
          <Link
            href={featuredTemplate.href}
            className="group overflow-hidden rounded-[2rem] border border-border bg-white text-ink no-underline shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-ink/5">
              <Image src={featuredTemplate.image} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
            </div>
            <div className="flex items-start justify-between gap-5 p-5 md:p-6">
              <div>
                <h3 className="text-xl font-semibold">{featuredTemplate.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{featuredTemplate.description}</p>
              </div>
              <ArrowLeft className="mt-1 size-5 shrink-0 text-champagne-strong transition group-hover:-translate-x-1" aria-hidden />
            </div>
          </Link>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[2rem] border border-dashed border-border bg-white/60 p-8 text-center text-sm text-muted-foreground">
            ستظهر هنا معاينة القالب المنشور.
          </div>
        )}
      </div>
    </section>
  );
}

function HomeBenefits({ sectionId, content, renderText }: SectionEditingProps & { content: HomeBenefitsContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.benefits" className="border-y border-border bg-white py-16 md:py-24">
      <div className="container-page">
        <header className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold text-ink md:text-5xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mt-10 grid gap-x-12 md:grid-cols-2">
          {content.items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3 border-t border-border py-6">
              <span className="pt-1 text-xs font-semibold tabular-nums text-champagne-strong">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
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
        <header className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-ink md:text-5xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
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
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg font-semibold">
                  <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                </strong>
                <span className={`mt-2 block text-sm leading-7 ${item.style === "primary" ? "text-white/62" : "text-muted-foreground"}`}>
                  <Text
                    field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                    render={renderText}
                  />
                </span>
              </span>
              <span className="mt-1 shrink-0 text-champagne-strong transition group-hover:-translate-x-1"><ButtonIcon icon={item.icon ?? "arrow"} /></span>
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
      <div className="container-page grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <header className="max-w-lg">
          <p className="text-sm font-semibold text-champagne">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold md:text-5xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
        </header>
        <div className="border-t border-white/12">
          {content.items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b border-white/12 py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start [&::-webkit-details-marker]:hidden">
                <span className="text-base font-semibold leading-7 md:text-lg">
                  <Text
                    field={{ sectionId, path: ["items", index, "question"], value: item.question }}
                    render={renderText}
                  />
                </span>
                <span className="text-xl text-champagne transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="max-w-2xl pb-5 text-sm leading-7 text-white/62 md:text-base">
                <Text
                  field={{ sectionId, path: ["items", index, "answer"], value: item.answer, multiline: true }}
                  render={renderText}
                />
              </p>
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
        <div className="flex flex-col gap-6 rounded-[2rem] bg-ink px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold md:text-4xl">
              <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/62 md:text-base">
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
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-5 text-sm font-semibold no-underline transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  if (style === "secondary") return `${base} border border-white/24 bg-white/8 text-white hover:bg-white/14`;
  if (style === "quiet") return `${base} px-3 text-white/78 hover:text-white`;
  return `${base} bg-champagne text-ink hover:bg-champagne/90`;
}

function journeyCardClasses(style: "primary" | "secondary" | "quiet"): string {
  const base = "group flex min-h-40 items-start gap-4 rounded-[1.5rem] border p-5 no-underline transition md:p-6";
  if (style === "primary") return `${base} border-ink bg-ink text-white hover:border-champagne-strong/50`;
  if (style === "quiet") return `${base} border-transparent bg-transparent text-ink hover:border-border hover:bg-white/55`;
  return `${base} border-border bg-white text-ink hover:border-champagne-strong/35`;
}

function ButtonIcon({ icon }: { icon: "arrow" | "external" | "none" }) {
  if (icon === "none") return null;
  return icon === "external"
    ? <ExternalLink className="size-3.5" aria-hidden />
    : <ArrowLeft className="size-4" aria-hidden />;
}
