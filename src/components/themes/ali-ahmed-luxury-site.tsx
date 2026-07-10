"use client";

import Image from "next/image";
import { useMemo, useState, type MouseEvent } from "react";
import {
  Camera,
  Check,
  Film,
  Images,
  Instagram,
  Menu,
  Star,
  UserPlus,
  Video,
  X
} from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { cn } from "@/lib/utils/cn";

type AliAhmedLuxurySiteProps = {
  site: PublicSiteViewModel;
};

const EMPTY_BOOKING_MESSAGE = "قم بتحديد باقة من الأعلى ليظهر ملخص الحجز هنا أولًا";

export function AliAhmedLuxurySite({ site }: AliAhmedLuxurySiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  const selectedPackage = site.packages.find((item) => item.id === selectedPackageId);
  const selectedExtras = site.extras.filter((item) => selectedExtraIds.includes(item.id));
  const total = useMemo(() => {
    return (selectedPackage?.priceAmount ?? 0) + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0);
  }, [selectedExtras, selectedPackage]);
  const bookingHref = createBookingHref({ site, selectedPackage, selectedExtras, total });
  const displayName = getSiteDisplayName(site);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  function toggleExtra(extraId: string) {
    setSelectedExtraIds((current) =>
      current.includes(extraId) ? current.filter((id) => id !== extraId) : [...current, extraId]
    );
  }

  function handleBookingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (selectedPackage) return;
    event.preventDefault();
    scrollToSection("packages");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#e5c07b] selection:text-black">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#050505]/72 backdrop-blur-xl">
        <div className="container-page relative flex h-16 items-center justify-between">
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="fixed right-4 top-5 z-50 max-w-[6.5rem] truncate font-display text-xs font-bold text-[#e5c07b] sm:max-w-[14rem] sm:text-xl md:static md:max-w-xs md:tracking-[0.12em]"
          >
            {displayName}
          </button>
          <div className="hidden items-center gap-8 text-sm text-white/68 md:flex">
            <ScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <ScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <ScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <ScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <ScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <SocialLinks href={bookingHref} compact onClick={handleBookingClick} />
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
              aria-label="القائمة"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-white/5 bg-[#050505]/95 px-6 py-3 md:hidden">
            <MobileScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <MobileScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <MobileScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <MobileScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <MobileScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
            <div className="mt-3 flex justify-center">
              <SocialLinks href={bookingHref} onClick={handleBookingClick} />
            </div>
          </div>
        ) : null}
      </nav>

      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Image
          src={site.hero.imageUrl}
          alt={site.hero.headline}
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.68),rgba(5,5,5,.22)_45%,#050505_100%)]" />
        <div className="container-page relative z-10 pt-24 text-center">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">تصوير احترافي</p>
          <h1 className="mx-auto mt-5 max-w-[16rem] break-words font-display text-2xl font-bold leading-tight text-white [overflow-wrap:anywhere] sm:max-w-2xl sm:text-5xl md:max-w-5xl md:text-8xl md:tracking-[0.12em]">
            {site.hero.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-[20rem] px-2 text-base leading-8 text-white/78 sm:max-w-2xl md:text-2xl">
            {site.hero.subheadline}
          </p>
          <button
            type="button"
            onClick={() => scrollToSection("packages")}
            className="mt-8 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-[linear-gradient(135deg,#f8e5ba,#e5c07b,#c49b50)] px-7 text-sm font-bold text-black"
          >
            اختر باقتك
          </button>
        </div>
      </section>

      {site.gallery.length ? (
        <section id="gallery" className="container-page scroll-mt-24 py-14 md:py-24">
          <SectionHeading eyebrow="أعمال مختارة" title="لمحات من الأعمال" />
          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            {site.gallery.slice(0, 3).map((image) => (
              <figure
                key={image.id}
                className="relative w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/5 bg-white/5 shadow-[0_20px_70px_rgba(0,0,0,.24)] md:w-auto"
              >
                <div className="relative aspect-[4/5] md:aspect-[4/3]">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover"
                  />
                </div>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section id="packages" className="bg-[#050505] py-16 md:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="باقات التصوير" title="اختر باقتك" />
        </div>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-7 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible md:px-12 lg:gap-5 [&::-webkit-scrollbar]:hidden">
          {site.packages.map((item, index) => {
            const selected = selectedPackageId === item.id;
            const imageUrl = item.imageUrl ?? site.gallery[index % site.gallery.length]?.url ?? site.hero.imageUrl;

            return (
              <article
                key={item.id}
                className={cn(
                  "relative w-[85vw] shrink-0 snap-center overflow-hidden rounded-2xl border bg-[#0f0f0f] shadow-[0_20px_80px_rgba(0,0,0,.25)] transition md:w-auto",
                  selected ? "border-[#e5c07b] shadow-[0_0_35px_rgba(229,192,123,.16)]" : "border-white/5"
                )}
              >
                <div className="relative h-48 md:h-56">
                  <Image src={imageUrl} alt={item.name} fill sizes="340px" className="object-cover opacity-78" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
                  {item.isHighlighted ? (
                    <span className="absolute left-3 top-3 inline-flex min-h-7 items-center gap-1 rounded-full border border-[#e5c07b]/30 bg-black/45 px-3 text-xs font-bold text-[#e5c07b] backdrop-blur">
                      <Star className="size-3" />
                      مميز
                    </span>
                  ) : null}
                </div>
                <div className="flex min-h-[320px] flex-col p-5 md:p-6">
                  <h3 className="font-display text-2xl font-bold tracking-wider">{item.name}</h3>
                  {item.subtitle ? <p className="mt-1 text-sm text-[#e5c07b]">{item.subtitle}</p> : null}
                  <p className="mt-5 font-display text-3xl font-bold">{item.price}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-white/68">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e5c07b]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setSelectedPackageId(item.id)}
                    className={cn(
                      "mt-6 min-h-12 rounded-xl text-sm font-bold transition",
                      selected ? "bg-[linear-gradient(135deg,#f8e5ba,#e5c07b,#c49b50)] text-black" : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    {selected ? "تم الاختيار" : "اختر الباقة"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {site.extras.length ? (
        <section id="extras" className="border-y border-white/5 bg-[#080808] py-16 md:py-24">
          <div className="container-page">
            <SectionHeading eyebrow="خدمات إضافية" title="إضافات مميزة" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {site.extras.map((extra) => {
                const selected = selectedExtraIds.includes(extra.id);
                const Icon = getExtraIcon(extra.iconKey);

                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "flex min-h-16 items-center justify-between gap-3 rounded-2xl border bg-white/[0.035] p-3 text-start transition md:min-h-20 md:p-4",
                      selected ? "border-[#e5c07b] bg-[#e5c07b]/8" : "border-white/5 hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-full border md:size-11",
                          selected ? "border-[#e5c07b] bg-[#e5c07b] text-black" : "border-white/10 bg-black/35 text-[#e5c07b]"
                        )}
                      >
                        {selected ? <Check className="size-4" /> : <Icon className="size-4" />}
                      </span>
                      <span className="truncate text-sm font-semibold md:text-base">{extra.name}</span>
                    </span>
                    <span className="shrink-0 font-display text-base font-bold text-[#e5c07b] md:text-lg">{extra.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="container-page py-14 md:py-24">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-[#e5c07b]/15 bg-[linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))] text-center shadow-[0_24px_90px_rgba(0,0,0,.3)]">
          <div className="border-b border-white/5 px-5 py-5 md:px-8">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">تأكيد سريع</p>
            <h2 className="mt-2 text-2xl font-bold">ملخص الحجز</h2>
          </div>
          {selectedPackage ? (
            <div className="m-4 space-y-4 rounded-2xl bg-[#0d0d0d] p-4 text-start md:m-6 md:p-5">
              <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                <span className="text-sm text-white/55">الباقة</span>
                <div className="text-left">
                  <strong className="block">{selectedPackage.name}</strong>
                  {selectedPackage.subtitle ? <span className="text-xs text-[#e5c07b]/78">{selectedPackage.subtitle}</span> : null}
                </div>
              </div>
              {selectedExtras.length ? (
                <div className="space-y-2 border-b border-white/5 pb-3">
                  {selectedExtras.map((extra) => (
                    <div key={extra.id} className="flex justify-between text-sm">
                      <span className="text-white/65">{extra.name}</span>
                      <span className="text-[#e5c07b]">{extra.price}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold">الإجمالي التقريبي</span>
                <span className="text-left font-display text-2xl font-bold text-[#e5c07b]">
                  {formatTotal(total, selectedPackage.currency)}
                </span>
              </div>
            </div>
          ) : (
            <p className="m-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm font-bold leading-7 text-white/55">
              {EMPTY_BOOKING_MESSAGE}
            </p>
          )}
          <a
            href={bookingHref}
            onClick={handleBookingClick}
            className={cn(
              "mx-4 mb-4 inline-flex min-h-12 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl text-sm font-bold transition md:mx-6 md:mb-6 md:w-[calc(100%-3rem)]",
              selectedPackage ? "bg-[#25d366] text-white hover:bg-[#20b858]" : "bg-white/5 text-white/35"
            )}
          >
            <WhatsAppMark className="size-5" />
            {selectedPackage ? site.contact.callToAction : "اختار باقة أولًا"}
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#020202] py-12 text-center">
        <h2 className="font-display text-3xl font-bold tracking-[0.18em] text-[#e5c07b]">{displayName}</h2>
        <div className="mt-6 flex items-center justify-center">
          <SocialLinks href={bookingHref} onClick={handleBookingClick} />
        </div>
        <p className="mt-8 font-display text-xs tracking-[0.2em] text-white/30">© {new Date().getFullYear()} FrameID</p>
      </footer>
      <a
        href={bookingHref}
        onClick={handleBookingClick}
        className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_14px_45px_rgba(37,211,102,.34)] transition hover:scale-105 hover:bg-[#20b858]"
        aria-label="حجز عبر واتساب"
      >
        <WhatsAppMark className="size-7" />
      </a>
    </main>
  );
}

function ScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="hover:text-[#e5c07b]">
      {label}
    </button>
  );
}

function MobileScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-3 text-center text-sm text-white/75 hover:bg-white/5 hover:text-[#e5c07b]"
    >
      {label}
    </button>
  );
}

function SocialLinks({
  href,
  compact = false,
  onClick
}: {
  href: string;
  compact?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const itemClass = compact
    ? "inline-flex size-9 items-center justify-center rounded-full border border-[#e5c07b]/18 bg-white/[0.055] text-white/72 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-[#e5c07b]/45 hover:bg-[#e5c07b]/14 hover:text-[#e5c07b]"
    : "inline-flex size-11 items-center justify-center rounded-full border border-[#e5c07b]/18 bg-white/[0.055] text-white/72 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-[#e5c07b]/45 hover:bg-[#e5c07b]/14 hover:text-[#e5c07b]";

  return (
    <div className="flex items-center gap-2">
      <a href={href} onClick={onClick} className={itemClass} aria-label="واتساب">
        <WhatsAppMark className={compact ? "size-[1.125rem]" : "size-5"} />
      </a>
      <a href={href} onClick={onClick} className={itemClass} aria-label="إنستجرام">
        <Instagram className={compact ? "size-4" : "size-5"} />
      </a>
      <a href={href} onClick={onClick} className={itemClass} aria-label="فيسبوك">
        <span className={compact ? "font-display text-base font-bold" : "font-display text-lg font-bold"}>f</span>
      </a>
    </div>
  );
}

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.03 4C9.4 4 4 9.3 4 15.82c0 2.08.56 4.12 1.62 5.9L4 28l6.44-1.56A12.2 12.2 0 0 0 16.03 27C22.66 27 28 21.7 28 15.18 28 8.66 22.66 4 16.03 4Zm0 20.97c-1.76 0-3.49-.47-5-1.35l-.36-.21-3.82.93.96-3.61-.24-.38a9.76 9.76 0 0 1-1.5-5.16c0-5.38 4.46-9.75 9.96-9.75s9.91 4.37 9.91 9.75-4.42 9.78-9.91 9.78Zm5.46-7.31c-.3-.15-1.78-.86-2.05-.96-.28-.1-.48-.15-.68.15-.2.29-.78.95-.95 1.14-.18.2-.35.22-.65.08-.3-.15-1.26-.45-2.4-1.44-.89-.78-1.49-1.74-1.66-2.03-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.03-.52-.07-.15-.68-1.6-.93-2.18-.25-.57-.5-.49-.68-.5h-.58c-.2 0-.52.08-.8.37-.27.3-1.05 1-1.05 2.44s1.08 2.84 1.23 3.03c.15.2 2.13 3.2 5.16 4.48.72.31 1.28.5 1.72.64.72.22 1.38.19 1.9.12.58-.09 1.78-.72 2.03-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.34Z" />
    </svg>
  );
}

function getSiteDisplayName(site: PublicSiteViewModel) {
  const title = typeof site.metadata.title === "string" ? site.metadata.title : site.hero.headline;
  return title.split(/[—|]/u)[0]?.trim() || site.hero.headline;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h2>
    </div>
  );
}

function getExtraIcon(iconKey: string | null) {
  switch (iconKey) {
    case "video":
      return Video;
    case "film":
      return Film;
    case "team":
      return UserPlus;
    case "album":
      return Images;
    default:
      return Camera;
  }
}

function createBookingHref({
  site,
  selectedPackage,
  selectedExtras,
  total
}: {
  site: PublicSiteViewModel;
  selectedPackage: PublicSiteViewModel["packages"][number] | undefined;
  selectedExtras: PublicSiteViewModel["extras"];
  total: number;
}) {
  if (!selectedPackage) return "#packages";

  const message = [
    `مرحباً، أريد تأكيد الحجز في موقع ${site.hero.headline}.`,
    "",
    `الباقة: ${selectedPackage.name} (${selectedPackage.price})`,
    selectedExtras.length
      ? `الإضافات: ${selectedExtras.map((item) => `${item.name} (${item.price})`).join("، ")}`
      : "الإضافات: لا يوجد",
    `الإجمالي التقريبي: ${formatTotal(total, selectedPackage.currency)}`
  ].join("\n");

  if (site.contact.whatsapp) {
    return `https://wa.me/${site.contact.whatsapp.replace(/[^\d]/gu, "")}?text=${encodeURIComponent(message)}`;
  }

  if (site.contact.email) {
    return `mailto:${site.contact.email}?subject=${encodeURIComponent(`حجز ${selectedPackage.name}`)}&body=${encodeURIComponent(message)}`;
  }

  return `mailto:?subject=${encodeURIComponent(site.hero.headline)}&body=${encodeURIComponent(message)}`;
}

function formatTotal(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} ${formatCurrencyLabel(currency)}`;
}

function formatCurrencyLabel(currency: string): string {
  return currency === "EGP" ? "جنيه" : currency;
}
