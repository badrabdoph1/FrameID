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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.72)_0%,rgba(7,7,7,.52)_40%,rgba(7,7,7,.88)_100%)]" />
      <div className="container-page relative z-10 flex flex-col items-center py-24 text-center md:py-32">
        <p className="mb-5 text-xs font-semibold tracking-wide text-champagne uppercase md:text-sm">
          <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
        </p>
        <h1 className="max-w-[14ch] text-balance text-[clamp(2.2rem,6.5vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
          <Text field={{ sectionId, path: ["headline"], value: content.headline }} render={renderText} />{" "}
          <span className="text-champagne">
            <Text
              field={{ sectionId, path: ["headlineHighlight"], value: content.headlineHighlight }}
              render={renderText}
            />
          </span>
        </h1>
        <p className="mt-5 max-w-[42ch] text-balance text-sm leading-7 text-white/60 md:mt-6 md:text-lg md:leading-8">
          <Text
            field={{ sectionId, path: ["subheadline"], value: content.subheadline, multiline: true }}
            render={renderText}
          />
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
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
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {content.trustPoints.slice(0, 3).map((point, index) => (
              <span key={`${point.text}-${index}`} className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-wide text-white/36 md:text-xs">
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
    <section data-page-section={sectionId} data-page-section-type="home.templates" className="bg-surface py-14 md:py-20">
      <div className="container-page flex flex-col items-center gap-8 text-center md:gap-10">
        <header className="max-w-lg">
          <p className="text-xs font-semibold tracking-wide text-champagne-strong uppercase md:text-sm">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold leading-snug text-ink md:text-4xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-3 max-w-[48ch] text-sm leading-7 text-muted-foreground md:text-base">
            <Text
              field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }}
              render={renderText}
            />
          </p>
        </header>
        {featuredTemplate ? (
          <Link
            href={featuredTemplate.href}
            className="group block w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white text-ink no-underline transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-ink/5 md:aspect-[16/10]">
              <Image src={featuredTemplate.image} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 md:p-5">
              <div className="text-start">
                <h3 className="text-base font-semibold md:text-lg">{featuredTemplate.name}</h3>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground md:text-sm">{featuredTemplate.description}</p>
              </div>
              <ArrowLeft className="size-4 shrink-0 text-champagne-strong transition group-hover:-translate-x-1" aria-hidden />
            </div>
          </Link>
        ) : (
          <div className="grid min-h-48 w-full max-w-xl place-items-center rounded-2xl border border-dashed border-border bg-white/60 p-8 text-center text-sm text-muted-foreground">
            ستظهر هنا معاينة القالب المنشور.
          </div>
        )}
      </div>
    </section>
  );
}

function HomeBenefits({ sectionId, content, renderText }: SectionEditingProps & { content: HomeBenefitsContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.benefits" className="bg-background py-14 md:py-20">
      <div className="container-page">
        <header className="mx-auto max-w-lg text-center">
          <h2 className="text-balance text-2xl font-semibold text-ink md:text-4xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mx-auto mt-10 grid max-w-3xl gap-0 md:mt-14 md:grid-cols-2 md:gap-x-10">
          {content.items.map((item, index) => (
            <article key={`${item.title}-${index}`} className={`border-border py-6 md:py-7 ${index < content.items.length - (content.items.length % 2 === 0 ? 2 : 1) ? "border-b" : ""} md:[&:nth-last-child(-n+2)]:border-b-0 ${index % 2 === 0 ? "md:border-e" : ""}`}>
              <div className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.04] text-xs font-bold tabular-nums text-champagne-strong md:size-9 md:text-sm">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink md:text-base">
                    <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm md:leading-7">
                    <Text
                      field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                      render={renderText}
                    />
                  </p>
                </div>
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
    <section data-page-section={sectionId} data-page-section-type="home.journey" className="bg-surface py-14 md:py-20">
      <div className="container-page">
        <header className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-semibold text-ink md:text-4xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            <Text field={{ sectionId, path: ["subtitle"], value: content.subtitle, multiline: true }} render={renderText} />
          </p>
        </header>
        <div className="mx-auto mt-10 grid max-w-3xl gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
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
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white md:size-9 md:text-sm">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold md:text-base">
                  <Text field={{ sectionId, path: ["items", index, "title"], value: item.title }} render={renderText} />
                </strong>
                <span className={`mt-1 block text-xs leading-6 ${item.style === "primary" ? "text-white/55" : "text-muted-foreground"} md:text-sm md:leading-7`}>
                  <Text
                    field={{ sectionId, path: ["items", index, "body"], value: item.body, multiline: true }}
                    render={renderText}
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeFaq({ sectionId, content, renderText }: SectionEditingProps & { content: HomeFaqContent }) {
  return (
    <section data-page-section={sectionId} data-page-section-type="home.faq" className="bg-ink py-14 text-white md:py-20">
      <div className="container-page mx-auto max-w-3xl">
        <header className="mb-8 text-center md:mb-10">
          <p className="text-xs font-semibold tracking-wide text-champagne uppercase md:text-sm">
            <Text field={{ sectionId, path: ["badge"], value: content.badge }} render={renderText} />
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold md:text-4xl">
            <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
          </h2>
        </header>
        <div className="border-t border-white/10">
          {content.items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b border-white/8 py-0.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start [&::-webkit-details-marker]:hidden md:py-5">
                <span className="text-sm font-semibold leading-6 md:text-base md:leading-7">
                  <Text
                    field={{ sectionId, path: ["items", index, "question"], value: item.question }}
                    render={renderText}
                  />
                </span>
                <span className="text-lg text-champagne/70 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="max-w-2xl pb-4 text-xs leading-6 text-white/50 md:pb-5 md:text-sm md:leading-7">
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
    <section data-page-section={sectionId} data-page-section-type="home.final-cta" className="bg-surface py-6 md:py-10">
      <div className="container-page">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-ink px-6 py-7 text-center text-white md:flex-row md:justify-between md:px-10 md:py-9 md:text-start">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold md:text-3xl">
              <Text field={{ sectionId, path: ["title"], value: content.title }} render={renderText} />
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/50 md:text-sm md:leading-7">
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
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold no-underline transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  if (style === "secondary") return `${base} border border-white/20 bg-white/8 text-white hover:bg-white/14`;
  if (style === "quiet") return `${base} px-3 text-white/65 hover:text-white`;
  return `${base} bg-champagne text-ink hover:bg-champagne/90`;
}

function journeyCardClasses(style: "primary" | "secondary" | "quiet"): string {
  const base = "group flex min-h-[7.5rem] flex-col items-start gap-3 rounded-2xl border p-4 no-underline transition md:min-h-[9rem] md:p-5";
  if (style === "primary") return `${base} border-ink bg-ink text-white hover:border-champagne-strong/50`;
  if (style === "quiet") return `${base} border-border bg-transparent text-ink hover:border-champagne-strong/30 hover:bg-white`;
  return `${base} border-border bg-white text-ink hover:border-champagne-strong/30`;
}

function ButtonIcon({ icon }: { icon: "arrow" | "external" | "none" }) {
  if (icon === "none") return null;
  return icon === "external"
    ? <ExternalLink className="size-3.5" aria-hidden />
    : <ArrowLeft className="size-4" aria-hidden />;
}
