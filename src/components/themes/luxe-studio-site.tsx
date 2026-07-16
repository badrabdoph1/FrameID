"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Camera,
  Check,
  Facebook,
  Film,
  Images,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Star,
  Video,
  X
} from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { cn } from "@/lib/utils/cn";
import {
  BookingAction,
  BookingFAB,
  BookingSummaryCard,
  PackageSelectButton,
  TemplateBookingProvider,
  useBooking,
} from "@/components/themes/template-booking-client";
import {
  normalizeContactHref,
  type NormalizedTemplateSection,
} from "@/modules/themes/template-contract";

type LuxeStudioSiteProps = {
  site: PublicSiteViewModel;
};

export function LuxeStudioSite({ site }: LuxeStudioSiteProps) {
  const displayName = site.contact.studioName?.trim() || site.hero.headline;
  const visibleSections = site.orderedSections.filter((section) => section.isVisible);
  const galleryImages = site.gallery.slice(0, 7);
  const heroImage = site.hero.imageUrl ? { url: site.hero.imageUrl, alt: site.hero.headline } : site.gallery[0] ?? null;

  return (
    <TemplateBookingProvider
      packages={site.packages}
      extras={site.extras}
      siteName={displayName}
      whatsapp={site.contact.whatsapp}
      email={site.contact.email}
    >
      <LuxeStudioSiteInner
        site={site}
        displayName={displayName}
        visibleSections={visibleSections}
        galleryImages={galleryImages}
        heroImage={heroImage}
      />
    </TemplateBookingProvider>
  );
}

function LuxeStudioSiteInner({
  site,
  displayName,
  visibleSections,
  galleryImages,
  heroImage,
}: {
  site: PublicSiteViewModel;
  displayName: string;
  visibleSections: NormalizedTemplateSection[];
  galleryImages: PublicSiteViewModel["gallery"];
  heroImage: { url: string; alt: string } | null;
}) {
  const booking = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);

  const gallerySection = site.sections.gallery;
  const packagesSection = site.sections.packages;
  const extrasSection = site.sections.extras;

  const showGallery = site.sections.gallery?.isVisible && site.gallery.length > 0;
  const showPackages = site.sections.packages?.isVisible && site.packages.length > 0;
  const showExtras = site.sections.extras?.isVisible && site.extras.length > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0a0f] text-white selection:bg-[#ff00ff]/30 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#hero" className="font-display text-xl font-bold tracking-tight text-white">
            {displayName}
          </a>
          <nav className="hidden gap-1 md:flex">
            {visibleSections.filter((section) => section.type !== "hero").map((section) => (
              <a
                key={section.type}
                href={`#${section.type}`}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f]/98 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between border-b border-white/5 p-4">
            <span className="font-display text-xl font-bold">{displayName}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5"
              aria-label="إغلاق القائمة"
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {visibleSections.filter((section) => section.type !== "hero").map((section) => (
              <a
                key={section.type}
                href={`#${section.type}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-white/80 transition hover:bg-white/5"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <main>
        {/* Hero */}
        {site.sections.hero?.isVisible ? (
          <section id="hero" className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
            {heroImage ? (
              <Image
                src={heroImage.url}
                alt={heroImage.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff00ff]/10 via-transparent to-[#00ffff]/10" />
            <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-end px-4 pb-16 pt-24 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">
                  {site.hero.eyebrow || "Luxury · Elegance"}
                </p>
                <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                  {site.hero.headline}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
                  {site.hero.subheadline}
                </p>
                <a
                  href={site.hero.cta.target === "whatsapp" && site.contact.whatsapp
                    ? normalizeContactHref("whatsapp", site.contact.whatsapp)
                    : `#${site.hero.cta.target}`}
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff00ff] to-[#00ffff] px-8 text-base font-bold text-white shadow-[0_0_30px_rgba(255,0,255,0.3)] transition hover:shadow-[0_0_40px_rgba(255,0,255,0.5)]"
                >
                  {site.hero.cta.label}
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {/* Gallery */}
        {showGallery ? (
          <section id="gallery" className="relative py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">
                  {String(gallerySection?.settings.eyebrow ?? "")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {gallerySection?.title}
                </h2>
                {gallerySection?.description ? (
                  <p className="mt-4 text-base leading-relaxed text-white/60">
                    {gallerySection.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
                {galleryImages.map((image, index) => (
                  <figure
                    key={image.id}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border border-white/5 bg-white/5",
                      index === 0 && "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
                    )}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={index === 0 ? 800 : 400}
                      height={index === 0 ? 800 : 400}
                      className="aspect-square w-full object-cover transition hover:scale-105"
                    />
                    {image.caption ? (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-sm font-medium text-white">
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Packages */}
        {showPackages ? (
          <section id="packages" className="relative border-y border-white/5 bg-[#0f0f14] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">
                  {String(packagesSection?.settings.eyebrow ?? "")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {packagesSection?.title}
                </h2>
                {packagesSection?.description ? (
                  <p className="mt-4 text-base leading-relaxed text-white/60">
                    {packagesSection.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {site.packages.map((item) => (
                  <article
                    key={item.id}
                    className={cn(
                      "group relative overflow-visible rounded-2xl border p-6 transition",
                      item.isHighlighted
                        ? "border-[#ff00ff]/30 bg-gradient-to-br from-[#ff00ff]/10 to-transparent shadow-[0_0_30px_rgba(255,0,255,0.15)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    )}
                  >
                    {item.isHighlighted ? (
                      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff00ff] to-[#00ffff] px-3 py-1 text-xs font-bold text-white shadow-lg">
                          <Star className="size-3 fill-current" />
                          الأكثر طلباً
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-4 pt-4">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold">{item.name}</h3>
                        {item.subtitle ? (
                          <p className="mt-2 text-sm text-white/50">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#ff00ff]">{item.price}</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                          <Check className="mt-0.5 size-4 shrink-0 text-[#00ffff]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <PackageSelectButton id={item.id} variant="luxe" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Extras */}
        {showExtras ? (
          <section id="extras" className="relative py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">
                  {String(extrasSection?.settings.eyebrow ?? "")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {extrasSection?.title}
                </h2>
                {extrasSection?.description ? (
                  <p className="mt-4 text-base leading-relaxed text-white/60">
                    {extrasSection.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {site.extras.map((extra) => (
                  <article
                    key={extra.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ff00ff]/20 to-[#00ffff]/20 text-white">
                        <ExtraIcon iconKey={extra.iconKey} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold">{extra.name}</h3>
                        {extra.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-white/50">{extra.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#ff00ff]">{extra.price}</span>
                      <button
                        type="button"
                        onClick={() => booking.toggleExtra(extra.id)}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-xs font-bold transition",
                          booking.selectedExtraIds.includes(extra.id)
                            ? "bg-[#ff00ff] text-white"
                            : "border border-white/20 text-white hover:border-white/40"
                        )}
                      >
                        {booking.selectedExtraIds.includes(extra.id) ? "✓ مضاف" : "إضافة"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Contact */}
        {site.sections.contact?.isVisible ? (
          <section id="contact" className="relative border-t border-white/5 bg-[#0f0f14] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">
                  {String(site.sections.contact?.settings.eyebrow ?? "")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  {site.sections.contact?.title}
                </h2>
                {site.sections.contact?.description ? (
                  <p className="mt-4 text-base leading-relaxed text-white/60">
                    {site.sections.contact.description}
                  </p>
                ) : null}
              </div>
              {showPackages ? (
                <div className="mt-12">
                  <BookingSummaryCard variant="luxe" />
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {site.contact.phone ? (
                  <ContactCard
                    label="اتصال"
                    value={site.contact.phone}
                    href={normalizeContactHref("phone", site.contact.phone)}
                    icon={Phone}
                  />
                ) : null}
                {site.contact.whatsapp ? (
                  <ContactCard
                    label="واتساب"
                    value={site.contact.whatsapp}
                    href={normalizeContactHref("whatsapp", site.contact.whatsapp)}
                    icon={MessageCircle}
                  />
                ) : null}
                {site.contact.instagram ? (
                  <ContactCard
                    label="Instagram"
                    value={site.contact.instagram}
                    href={normalizeContactHref("instagram", site.contact.instagram)}
                    icon={Instagram}
                  />
                ) : null}
                {site.contact.facebook ? (
                  <ContactCard
                    label="Facebook"
                    value={site.contact.facebook}
                    href={normalizeContactHref("facebook", site.contact.facebook)}
                    icon={Facebook}
                  />
                ) : null}
                {site.contact.email ? (
                  <ContactCard
                    label="البريد الإلكتروني"
                    value={site.contact.email}
                    href={normalizeContactHref("email", site.contact.email)}
                    icon={Mail}
                  />
                ) : null}
              </div>
              {showPackages ? (
                <div className="mt-8">
                  <BookingAction label={site.contact.callToAction} variant="luxe" />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0f] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff00ff]">FRAMEID</p>
          <p className="mt-3 font-display text-xl font-bold">{displayName}</p>
        </div>
      </footer>

      {showPackages ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0f]/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
          <BookingAction label={site.contact.callToAction} variant="luxe" sticky />
        </div>
      ) : null}

      <BookingFAB variant="luxe" />
    </div>
  );
}

function ContactCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  icon: typeof Phone;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#ff00ff]/30 hover:bg-white/10"
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ff00ff]/20 to-[#00ffff]/20 text-white transition group-hover:from-[#ff00ff]/30 group-hover:to-[#00ffff]/30">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 truncate text-xs text-white/50">{value}</p>
      </div>
    </a>
  );
}

function ExtraIcon({ iconKey }: { iconKey: string | null }) {
  if (iconKey === "video") return <Video className="size-5" />;
  if (iconKey === "camera") return <Camera className="size-5" />;
  if (iconKey === "album") return <Images className="size-5" />;
  return <Film className="size-5" />;
}
