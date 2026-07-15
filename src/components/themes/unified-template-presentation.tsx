import Image from "next/image";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

import {
  BookingAction,
  BookingFAB,
  ExtraToggleButton,
  PackageSelectButton,
  TemplateBookingProvider,
} from "@/components/themes/template-booking-client";
import { cn } from "@/lib/utils/cn";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import {
  normalizeContactHref,
  resolveHeroCtaHref,
  type NormalizedTemplateSection,
} from "@/modules/themes/template-contract";

type Variant = "noir" | "rose";

export function UnifiedTemplatePresentation({ site, variant }: { site: PublicSiteViewModel; variant: Variant }) {
  const displayName = site.contact.studioName?.trim() || site.hero.headline;
  const visibleSections = site.orderedSections.filter((section) => section.isVisible);
  const dark = variant === "noir";

  return (
    <TemplateBookingProvider
      packages={site.packages}
      extras={site.extras}
      siteName={displayName}
      whatsapp={site.contact.whatsapp}
      email={site.contact.email}
    >
      <div dir="rtl" className={cn("min-h-screen overflow-x-hidden pb-20 selection:text-black md:pb-0", dark ? "bg-[#050505] text-white selection:bg-[#e5c07b]" : "bg-[#fff8f4] text-[#2c1810] selection:bg-[#d48a9e]") }>
        <TemplateHeader sections={visibleSections} variant={variant} displayName={displayName} />
        <main>
          {visibleSections.map((section) => (
            <Section key={section.type} section={section} site={site} variant={variant} />
          ))}
        </main>
        <footer className={cn("border-t py-10 text-center", dark ? "border-white/8 bg-[#080808]" : "border-[#eaddd4] bg-[#f4f8f3]") }>
          <p className={cn("text-xs font-black tracking-[0.28em]", dark ? "text-[#e5c07b]" : "text-[#8fb89a]")}>FRAMEID</p>
          <p className="mt-3 font-display text-2xl font-bold">{displayName}</p>
        </footer>
        {site.sections.packages.isVisible && site.packages.length ? (
          <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t p-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden", dark ? "border-white/10 bg-black/88" : "border-[#eaddd4] bg-[#fff8f4]/92") }>
            <BookingAction label={site.contact.callToAction} variant={variant} sticky />
          </div>
        ) : null}
        <BookingFAB variant={variant} />
      </div>
    </TemplateBookingProvider>
  );
}

function TemplateHeader({ sections, variant, displayName }: { sections: NormalizedTemplateSection[]; variant: Variant; displayName: string }) {
  const dark = variant === "noir";
  return (
    <header className={cn("sticky top-0 z-30 h-16 border-b backdrop-blur-xl", dark ? "border-white/8 bg-black/86" : "border-[#eaddd4] bg-[#fff8f4]/90") }>
      <div className="container-page flex h-full items-center justify-between gap-4">
        <a href="#hero" className={cn("truncate font-display text-base font-bold no-underline sm:text-lg", dark ? "text-[#e5c07b]" : "text-[#d48a9e]")}>{displayName}</a>
        <nav aria-label="أقسام الموقع" className="flex max-w-[58%] gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.filter((section) => section.type !== "hero").map((section) => (
            <a key={section.type} href={`#${section.type}`} className={cn("inline-flex min-h-11 shrink-0 items-center px-2 text-[11px] font-black no-underline sm:px-3 sm:text-xs", dark ? "text-white/65 hover:text-white" : "text-[#6f5c55] hover:text-[#d48a9e]")}>{section.title}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Section({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  switch (section.type) {
    case "hero": return <HeroSection section={section} site={site} variant={variant} />;
    case "gallery": return site.gallery.length ? <GallerySection section={section} site={site} variant={variant} /> : null;
    case "packages": return site.packages.length ? <PackagesSection section={section} site={site} variant={variant} /> : null;
    case "extras": return site.extras.length ? <ExtrasSection section={section} site={site} variant={variant} /> : null;
    case "contact": return <ContactSection section={section} site={site} variant={variant} />;
  }
}

function HeroSection({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  const dark = variant === "noir";
  const height = site.hero.height === "compact" ? "min-h-[62svh]" : site.hero.height === "tall" ? "min-h-[92svh] md:min-h-[105vh]" : "min-h-[calc(100svh-4rem)]";
  const overlay = site.hero.overlay === "none" ? "bg-transparent" : site.hero.overlay === "soft" ? dark ? "bg-black/25" : "bg-[#fff8f4]/30" : site.hero.overlay === "strong" ? dark ? "bg-black/72" : "bg-[#fff8f4]/78" : dark ? "bg-black/50" : "bg-[#fff8f4]/58";
  const objectPosition = site.hero.position === "left" ? "left" : site.hero.position === "right" ? "right" : site.hero.position;
  return (
    <section id="hero" data-template-section="hero" className={cn("relative isolate flex scroll-mt-16 items-end overflow-hidden", height)}>
      {site.hero.imageUrl ? <Image src={site.hero.imageUrl} alt={site.hero.headline} fill priority sizes="100vw" style={{ objectPosition }} className="object-cover" /> : null}
      <div className={cn("absolute inset-0", overlay)} />
      <div className={cn("absolute inset-0", dark ? "bg-gradient-to-t from-[#050505] via-transparent to-black/15" : "bg-gradient-to-t from-[#fff8f4] via-transparent to-white/20")} />
      <div className="container-page relative z-10 w-full pb-12 pt-16 text-start sm:pb-16 md:pb-24">
        <div className="max-w-3xl">
          <p className={cn("text-xs font-black uppercase tracking-[0.24em]", dark ? "text-[#e5c07b]" : "text-[#6d9a78]")}>{site.hero.eyebrow || String(section.settings.eyebrow ?? "")}</p>
          <h1 className="mt-4 text-balance font-display text-[clamp(2.6rem,12vw,5.8rem)] font-bold leading-[.98] tracking-[-.035em]">{site.hero.headline}</h1>
          <p className={cn("mt-5 max-w-2xl text-sm font-bold leading-7 sm:text-base md:text-lg md:leading-9", dark ? "text-white/72" : "text-[#6f5c55]")}>{site.hero.subheadline}</p>
          <a href={resolveHeroCtaHref(site.hero, site.contact)} className={cn("mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-sm font-black no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2", dark ? "bg-[#e5c07b] text-black ring-[#e5c07b] ring-offset-black" : "bg-[#d48a9e] text-white ring-[#d48a9e] ring-offset-[#fff8f4]")}>{site.hero.cta.label}</a>
        </div>
      </div>
    </section>
  );
}

function GallerySection({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  const dark = variant === "noir";
  const limit = typeof section.settings.limit === "number" ? section.settings.limit : 6;
  const images = site.gallery.slice(0, limit);
  const snap = section.settings.layout !== "grid";
  return (
    <section id="gallery" data-template-section="gallery" className={cn("scroll-mt-16 py-14 md:py-24", dark ? "bg-[#080808]" : "bg-white") }>
      <div className="container-page">
        <SectionHeading section={section} variant={variant} />
        <div className={cn("mt-8 gap-3", snap ? "-mx-4 flex snap-x overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 md:grid-cols-3 [&::-webkit-scrollbar]:hidden" : "grid grid-cols-2 md:grid-cols-3") }>
          {images.map((image) => <figure key={image.id} className={cn("relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border", snap && "w-[78vw] shrink-0 snap-center sm:w-auto", dark ? "border-white/8 bg-white/[.04]" : "border-[#eaddd4] bg-[#fff8f4]") }><Image src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 32vw, 78vw" className="object-cover" />{image.caption ? <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-xs font-bold text-white">{image.caption}</figcaption> : null}</figure>)}
        </div>
      </div>
    </section>
  );
}

function PackagesSection({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  const dark = variant === "noir";
  const snap = section.settings.layout !== "stack";
  return (
    <section id="packages" data-template-section="packages" className={cn("scroll-mt-16 py-14 md:py-24", dark ? "border-y border-white/6 bg-[#050505]" : "bg-[#fff8f4]") }>
      <div className="container-page">
        <SectionHeading section={section} variant={variant} />
        <div className={cn("mt-8 gap-4", snap ? "-mx-4 flex snap-x overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:px-0 [&::-webkit-scrollbar]:hidden" : "grid") }>
          {site.packages.map((item, index) => {
            const imageUrl = item.imageUrl ?? site.gallery[index % Math.max(site.gallery.length, 1)]?.url;
            return <article key={item.id} className={cn("relative flex flex-col overflow-visible rounded-[1.6rem] border p-4", snap && "w-[84vw] shrink-0 snap-center md:w-auto", dark ? "border-white/9 bg-[#101010]" : "border-[#eaddd4] bg-white shadow-[0_20px_60px_rgba(44,24,16,.07)]") }>
              {item.isHighlighted ? <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2"><span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black shadow-lg", dark ? "bg-[#e5c07b] text-black" : "bg-[#d48a9e] text-white")}><Star className="size-3 fill-current" aria-hidden />الأكثر طلباً</span></div> : null}
              {imageUrl ? <div className="relative -mx-4 -mt-4 mb-4 aspect-[16/10] overflow-hidden rounded-t-[1.6rem]"><Image src={imageUrl} alt={item.name} fill sizes="(min-width: 768px) 30vw, 84vw" className="object-cover" /></div> : null}
              <div className="flex items-start justify-between gap-3 pt-4">
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold">{item.name}</h3>
                  {item.subtitle ? <p className={cn("mt-1 text-xs font-bold", dark ? "text-white/48" : "text-[#6f5c55]")}>{item.subtitle}</p> : null}
                </div>
                <span className={cn("shrink-0 rounded-xl px-3 py-2 text-xs font-black", dark ? "bg-[#e5c07b]/12 text-[#e5c07b]" : "bg-[#f5e4ea] text-[#b87084]")}>{item.price}</span>
              </div>
              <ul className={cn("mt-4 flex-1 space-y-2 text-xs leading-6", dark ? "text-white/62" : "text-[#6f5c55]")}>{item.features.map((feature) => <li key={feature}>• {feature}</li>)}</ul>
              <PackageSelectButton id={item.id} variant={variant} />
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}

function ExtrasSection({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  const dark = variant === "noir";
  return (
    <section id="extras" data-template-section="extras" className={cn("scroll-mt-16 py-14 md:py-24", dark ? "bg-[#080808]" : "bg-white") }>
      <div className="container-page"><SectionHeading section={section} variant={variant} />
        <div className={cn("mt-8 grid gap-3", section.settings.layout === "cards" ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2") }>
          {site.extras.map((extra) => <article key={extra.id} className={cn("flex min-h-20 items-center gap-3 rounded-[1.35rem] border p-3", dark ? "border-white/8 bg-white/[.035]" : "border-[#eaddd4] bg-[#fff8f4]") }><ExtraToggleButton id={extra.id} variant={variant} /><div className="min-w-0 flex-1"><h3 className="text-sm font-black">{extra.name}</h3>{extra.description ? <p className={cn("mt-1 line-clamp-2 text-xs", dark ? "text-white/45" : "text-[#8c7a74]")}>{extra.description}</p> : null}</div><strong className={cn("shrink-0 text-xs", dark ? "text-[#e5c07b]" : "text-[#d48a9e]")}>{extra.price}</strong></article>)}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ section, site, variant }: { section: NormalizedTemplateSection; site: PublicSiteViewModel; variant: Variant }) {
  const dark = variant === "noir";
  const actions = [
    site.contact.phone ? { label: "اتصال", value: site.contact.phone, href: normalizeContactHref("phone", site.contact.phone), icon: Phone } : null,
    site.contact.whatsapp ? { label: "واتساب", value: site.contact.whatsapp, href: normalizeContactHref("whatsapp", site.contact.whatsapp), icon: MessageCircle } : null,
    site.contact.instagram ? { label: "Instagram", value: site.contact.instagram, href: normalizeContactHref("instagram", site.contact.instagram), icon: Instagram } : null,
    site.contact.facebook ? { label: "Facebook", value: site.contact.facebook, href: normalizeContactHref("facebook", site.contact.facebook), icon: Facebook } : null,
    site.contact.tiktok ? { label: "TikTok", value: site.contact.tiktok, href: normalizeContactHref("tiktok", site.contact.tiktok), icon: TikTokIcon } : null,
    site.contact.email ? { label: "البريد الإلكتروني", value: site.contact.email, href: normalizeContactHref("email", site.contact.email), icon: Mail } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string; icon: typeof Phone }>;
  return (
    <section id="contact" data-template-section="contact" className={cn("scroll-mt-16 py-14 md:py-24", dark ? "bg-[#050505]" : "bg-[#fff8f4]") }>
      <div className="container-page"><SectionHeading section={section} variant={variant} />
        <div className={cn("mx-auto mt-8 grid max-w-4xl gap-3", section.settings.layout === "stack" ? "grid-cols-1" : "sm:grid-cols-2") }>
          {actions.map(({ label, value, href, icon: Icon }) => <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={cn("flex min-h-16 items-center gap-3 rounded-[1.35rem] border p-3 no-underline outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2", dark ? "border-white/9 bg-white/[.045] text-white ring-[#e5c07b] ring-offset-black hover:border-[#e5c07b]/50" : "border-[#eaddd4] bg-white text-[#2c1810] ring-[#d48a9e] ring-offset-[#fff8f4] hover:border-[#d48a9e]") }><span className={cn("grid size-11 shrink-0 place-items-center rounded-full", dark ? "bg-[#e5c07b]/12 text-[#e5c07b]" : "bg-[#f5e4ea] text-[#d48a9e]")}><Icon className="size-5" aria-hidden /></span><span className="min-w-0"><strong className="block text-sm">{label}</strong><span className={cn("mt-1 block truncate text-xs", dark ? "text-white/45" : "text-[#8c7a74]")}>{value}</span></span></a>)}
          <div className={cn("flex min-h-16 items-center gap-3 rounded-[1.35rem] border p-3", dark ? "border-white/9 bg-white/[.045]" : "border-[#eaddd4] bg-white") }><span className={cn("grid size-11 shrink-0 place-items-center rounded-full", dark ? "bg-[#e5c07b]/12 text-[#e5c07b]" : "bg-[#e8f0e6] text-[#6d9a78]")}><MapPin className="size-5" aria-hidden /></span><span><strong className="block text-sm">مكان العمل</strong><span className={cn("mt-1 block text-xs", dark ? "text-white/48" : "text-[#8c7a74]")}>{site.contact.workLocation}</span></span></div>
        </div>
        {site.sections.packages.isVisible && site.packages.length ? <div className="mx-auto mt-5 max-w-4xl"><BookingAction label={site.contact.callToAction} variant={variant} /></div> : null}
      </div>
    </section>
  );
}

function SectionHeading({ section, variant }: { section: NormalizedTemplateSection; variant: Variant }) {
  const dark = variant === "noir";
  return <div className="max-w-2xl"><p className={cn("text-xs font-black uppercase tracking-[.22em]", dark ? "text-[#e5c07b]" : "text-[#6d9a78]")}>{String(section.settings.eyebrow ?? "")}</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{section.title}</h2>{section.description ? <p className={cn("mt-3 text-sm font-bold leading-7", dark ? "text-white/52" : "text-[#8c7a74]")}>{section.description}</p> : null}</div>;
}

function TikTokIcon({ className }: { className?: string }) { return <span aria-hidden className={cn("font-black", className)}>♪</span>; }
