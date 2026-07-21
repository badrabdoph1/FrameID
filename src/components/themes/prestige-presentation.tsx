"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Star,
} from "lucide-react";

import {
  BookingAction,
  BookingFAB,
  PackageSelectButton,
  TemplateBookingProvider,
  useBooking,
} from "@/components/themes/template-booking-client";
import { cn } from "@/lib/utils/cn";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import {
  normalizeContactHref,
  resolveHeroCtaHref,
  type NormalizedTemplateSection,
} from "@/modules/themes/template-contract";

export function PrestigePresentation({ site }: { site: PublicSiteViewModel }) {
  const displayName = site.contact.studioName?.trim() || site.hero.headline;
  const visibleSections = site.orderedSections.filter((section) => section.isVisible);

  return (
    <TemplateBookingProvider
      packages={site.packages}
      extras={site.extras}
      siteName={displayName}
      whatsapp={site.contact.whatsapp}
      email={site.contact.email}
    >
      <div dir="rtl" className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white selection:bg-gradient-to-r selection:from-[#d4a574] selection:to-[#e8c4a0] selection:text-black">
        <PrestigeHeader sections={visibleSections} displayName={displayName} />
        <main>
          {visibleSections.map((section) => (
            <PrestigeSection key={section.type} section={section} site={site} />
          ))}
        </main>
        <PrestigeFooter displayName={displayName} />
        {site.sections.packages.isVisible && site.packages.length ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 p-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
            <BookingAction label={site.contact.callToAction} variant="prestige" sticky />
          </div>
        ) : null}
        <BookingFAB variant="prestige" />
      </div>
    </TemplateBookingProvider>
  );
}

function PrestigeHeader({ sections, displayName }: { sections: NormalizedTemplateSection[]; displayName: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-500",
      scrolled ? "bg-black/80 backdrop-blur-xl shadow-lg shadow-black/20" : "bg-transparent"
    )}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <a href="#hero" className="group flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] opacity-20 blur-lg" />
            <div className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#d4a574] to-[#e8c4a0] sm:size-10">
              <Star className="size-4 fill-black text-black sm:size-5" />
            </div>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
            {displayName}
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {sections.filter((s) => s.type !== "hero").map((section) => (
            <a
              key={section.type}
              href={`#${section.type}`}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
            >
              {section.title}
            </a>
          ))}
        </nav>
        <a
          href="#packages"
          className="hidden rounded-full bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] px-5 py-2.5 text-sm font-bold text-black transition-all duration-300 hover:shadow-lg hover:shadow-[#d4a574]/30 md:inline-flex"
        >
          احجز الآن
        </a>
      </div>
    </header>
  );
}

function PrestigeSection({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  switch (section.type) {
    case "hero": return <PrestigeHero section={section} site={site} />;
    case "gallery": return site.gallery.length ? <PrestigeGallery section={section} site={site} /> : null;
    case "packages": return site.packages.length ? <PrestigePackages section={section} site={site} /> : null;
    case "extras": return site.extras.length ? <PrestigeExtras section={section} site={site} /> : null;
    case "contact": return <PrestigeContact section={section} site={site} />;
  }
}

function PrestigeHero({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  const videoRef = useRef<HTMLDivElement>(null);

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden">
      {/* Background Image with Parallax */}
      <div ref={videoRef} className="absolute inset-0">
        {site.hero.imageUrl ? (
          <Image
            src={site.hero.imageUrl}
            alt={site.hero.headline}
            fill
            priority
            sizes="100vw"
            className="scale-105 object-cover transition-transform duration-[2s]"
          />
        ) : null}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 h-96 w-96 animate-pulse rounded-full bg-[#d4a574]/20 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-[#e8c4a0]/20 blur-[120px]" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full py-20">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-4 py-2 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4a574]" />
            <span className="text-xs font-semibold tracking-wider text-[#d4a574] uppercase">
              {site.hero.eyebrow || section.settings.eyebrow}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 max-w-4xl font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {site.hero.headline}
          </h1>

          {/* Subheadline */}
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl md:text-2xl">
            {site.hero.subheadline}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href={resolveHeroCtaHref(site.hero, site.contact)}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:shadow-2xl hover:shadow-[#d4a574]/40 sm:text-lg"
            >
              <span className="relative z-10">{site.hero.cta.label}</span>
              <ArrowLeft className="relative z-10 size-5 transition-transform duration-300 group-hover:-translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            {site.contact.whatsapp && (
              <a
                href={normalizeContactHref("whatsapp", site.contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20 sm:text-lg"
              >
                <MessageCircle className="size-5" />
                <span>واتساب</span>
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <div>
              <div className="font-display text-3xl font-bold text-[#d4a574] sm:text-4xl">500+</div>
              <div className="mt-1 text-sm text-white/60">جلسة ناجحة</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-[#d4a574] sm:text-4xl">10+</div>
              <div className="mt-1 text-sm text-white/60">سنوات خبرة</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-[#d4a574] sm:text-4xl">100%</div>
              <div className="mt-1 text-sm text-white/60">رضا العملاء</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/40">اكتشف المزيد</span>
          <div className="h-12 w-6 rounded-full border-2 border-white/20 p-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#d4a574]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PrestigeGallery({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  const limit = typeof section.settings.limit === "number" ? section.settings.limit : 6;
  const images = site.gallery.slice(0, limit);

  return (
    <section id="gallery" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-4 py-2">
            <span className="text-xs font-semibold tracking-wider text-[#d4a574] uppercase">
              {section.settings.eyebrow}
            </span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mx-auto max-w-2xl text-lg text-white/60">
              {section.description}
            </p>
          ) : null}
        </div>

        {/* Gallery Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/5",
                index === 0 && "sm:col-span-2 sm:row-span-2 sm:aspect-square"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {image.caption ? (
                <div className="absolute inset-x-0 bottom-0 translate-y-full p-6 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="text-sm font-medium text-white">{image.caption}</p>
                </div>
              ) : null}
              <div className="absolute inset-0 border-2 border-transparent transition-all duration-300 group-hover:border-[#d4a574]/50" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrestigePackages({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  return (
    <section id="packages" className="relative py-20 sm:py-32">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4a574]/5 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-4 py-2">
            <span className="text-xs font-semibold tracking-wider text-[#d4a574] uppercase">
              {section.settings.eyebrow}
            </span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mx-auto max-w-2xl text-lg text-white/60">
              {section.description}
            </p>
          ) : null}
        </div>

        {/* Packages Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {site.packages.map((item) => {
            const imageUrl = item.imageUrl ?? site.gallery[0]?.url;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2",
                  item.isHighlighted
                    ? "border-2 border-[#d4a574]/50 shadow-2xl shadow-[#d4a574]/20"
                    : "border border-white/10 hover:border-[#d4a574]/30"
                )}
              >
                {/* Highlighted Badge */}
                {item.isHighlighted ? (
                  <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] px-4 py-1.5 text-xs font-bold text-black shadow-lg">
                      <Star className="size-3 fill-black" />
                      الأكثر طلباً
                    </div>
                  </div>
                ) : null}

                {/* Image */}
                {imageUrl ? (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : null}

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-white">{item.name}</h3>
                      {item.subtitle ? (
                        <p className="mt-1 text-sm text-white/60">{item.subtitle}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl font-bold text-[#d4a574]">
                        {item.price}
                      </div>
                    </div>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
                        <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d4a574]/20">
                          <Check className="size-3 text-[#d4a574]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <PackageSelectButton id={item.id} variant="prestige" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PrestigeExtras({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  return (
    <section id="extras" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-4 py-2">
            <span className="text-xs font-semibold tracking-wider text-[#d4a574] uppercase">
              {section.settings.eyebrow}
            </span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mx-auto max-w-2xl text-lg text-white/60">
              {section.description}
            </p>
          ) : null}
        </div>

        {/* Extras Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {site.extras.map((extra) => (
            <div
              key={extra.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#d4a574]/30 hover:bg-white/10"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#d4a574]/20 to-[#e8c4a0]/20">
                  <Play className="size-5 text-[#d4a574]" />
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-[#d4a574]">
                    {extra.price}
                  </div>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">{extra.name}</h3>
              {extra.description ? (
                <p className="mb-4 text-sm text-white/60">{extra.description}</p>
              ) : null}
              <button
                type="button"
                className="w-full rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 py-2 text-sm font-bold text-[#d4a574] transition-all duration-300 hover:bg-[#d4a574]/20"
              >
                أضف للحجز
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrestigeContact({ section, site }: { section: NormalizedTemplateSection; site: PublicSiteViewModel }) {
  const contactMethods = [
    site.contact.phone && { icon: Phone, label: "اتصال", value: site.contact.phone, href: normalizeContactHref("phone", site.contact.phone) },
    site.contact.whatsapp && { icon: MessageCircle, label: "واتساب", value: site.contact.whatsapp, href: normalizeContactHref("whatsapp", site.contact.whatsapp) },
    site.contact.email && { icon: Mail, label: "بريد", value: site.contact.email, href: normalizeContactHref("email", site.contact.email) },
    site.contact.instagram && { icon: Instagram, label: "إنستغرام", value: site.contact.instagram, href: normalizeContactHref("instagram", site.contact.instagram) },
    site.contact.facebook && { icon: Facebook, label: "فيسبوك", value: site.contact.facebook, href: normalizeContactHref("facebook", site.contact.facebook) },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; href: string }>;

  return (
    <section id="contact" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d4a574]/30 bg-[#d4a574]/10 px-4 py-2">
            <span className="text-xs font-semibold tracking-wider text-[#d4a574] uppercase">
              {section.settings.eyebrow}
            </span>
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mx-auto max-w-2xl text-lg text-white/60">
              {section.description}
            </p>
          ) : null}
        </div>

        {/* Contact Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contactMethods.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#d4a574]/30 hover:bg-white/10"
            >
              <div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-[#d4a574]/20 to-[#e8c4a0]/20 transition-all duration-300 group-hover:from-[#d4a574]/30 group-hover:to-[#e8c4a0]/30">
                <Icon className="size-6 text-[#d4a574]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{label}</div>
                <div className="mt-1 text-sm text-white/60">{value}</div>
              </div>
            </a>
          ))}
          {site.contact.workLocation && (
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="grid size-14 place-items-center rounded-xl bg-gradient-to-br from-[#d4a574]/20 to-[#e8c4a0]/20">
                <MapPin className="size-6 text-[#d4a574]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">الموقع</div>
                <div className="mt-1 text-sm text-white/60">{site.contact.workLocation}</div>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        {site.sections.packages.isVisible && site.packages.length ? (
          <div className="mt-12">
            <BookingAction label={site.contact.callToAction} variant="prestige" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PrestigeFooter({ displayName }: { displayName: string }) {
  return (
    <footer className="border-t border-white/10 bg-black py-12">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-4 font-display text-2xl font-bold text-white">
          {displayName}
        </div>
        <div className="mb-6 text-sm text-white/40">
          صُنع بفخر بواسطة FrameID
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#d4a574]/50" />
          <Star className="size-4 fill-[#d4a574] text-[#d4a574]" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#d4a574]/50" />
        </div>
      </div>
    </footer>
  );
}
