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
  const galleryImages = site.gallery.slice(0, 4);
  const heroImage = galleryImages[0] ?? null;
  const featuredImage = galleryImages[1]?.url ?? galleryImages[0]?.url;
  const displayName = getSiteDisplayName(site);

  const total = useMemo(() => {
    return (selectedPackage?.priceAmount ?? 0) + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0);
  }, [selectedExtras, selectedPackage]);

  const bookingHref = createBookingHref({ site, selectedPackage, selectedExtras, total });

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
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#050505]/78 backdrop-blur-2xl">
        <div className="container-page flex h-16 items-center justify-between gap-3 md:h-20">
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="max-w-[10rem] truncate font-display text-sm font-bold tracking-[0.16em] text-[#e5c07b] sm:max-w-xs md:text-xl"
          >
            {displayName}
          </button>

          <div className="hidden items-center rounded-full border border-white/10 bg-white/[0.045] px-2 py-1 text-sm text-white/68 shadow-[0_18px_60px_rgba(0,0,0,.2)] md:flex">
            <ScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <ScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <ScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <ScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <ScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SocialLinks site={site} bookingHref={bookingHref} compact onBookingClick={handleBookingClick} />
            </div>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white md:hidden"
              aria-label="القائمة"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/5 bg-[#050505]/96 px-6 py-3 md:hidden">
            <MobileScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <MobileScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <MobileScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <MobileScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <MobileScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
            <div className="mt-3 flex justify-center">
              <SocialLinks site={site} bookingHref={bookingHref} onBookingClick={handleBookingClick} />
            </div>
          </div>
        ) : null}
      </nav>

      <section id="home" className="relative overflow-hidden pt-16 md:min-h-screen md:pt-20">
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="scale-105 object-cover opacity-48"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(229,192,123,.18),transparent_28%),linear-gradient(90deg,rgba(5,5,5,.92),rgba(5,5,5,.64)_44%,rgba(5,5,5,.88)),linear-gradient(180deg,rgba(0,0,0,.78),rgba(5,5,5,.35)_42%,#050505_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />

        <div className="container-page relative z-10 flex min-h-[64svh] items-end py-12 md:min-h-[calc(100vh-5rem)] md:items-center md:py-20">
          <div className="w-full max-w-3xl pb-8 text-center md:pb-0 md:text-start">
            <h1 className="mx-auto max-w-4xl text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:mx-0 md:text-7xl lg:text-8xl">
              {site.hero.headline}
            </h1>
            {displayName !== site.hero.headline ? (
              <p className="mx-auto mt-4 max-w-2xl font-display text-sm font-bold tracking-[0.24em] text-[#e5c07b] md:mx-0 md:text-base">
                {displayName}
              </p>
            ) : null}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/76 md:mx-0 md:text-xl md:leading-10">
              {site.hero.subheadline}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:mt-9 md:justify-start">
              <button
                type="button"
                onClick={() => scrollToSection("packages")}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-[linear-gradient(135deg,#fff3cf,#e5c07b,#b9822b)] px-8 text-sm font-black text-black shadow-[0_22px_60px_rgba(229,192,123,.22)] transition hover:-translate-y-0.5"
              >
                اختر باقتك
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("gallery")}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/14 bg-white/[0.055] px-8 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
              >
                شاهد الأعمال
              </button>
            </div>
          </div>
        </div>
      </section>

      {site.gallery.length ? (
        <section id="gallery" className="container-page scroll-mt-24 py-14 md:py-28">
          <SectionHeading eyebrow="أعمال مختارة" title="لمحات من الأعمال" description="مختارات من جلسات الزفاف والخطوبة بتفاصيل قريبة وإضاءة طبيعية." />
          <div className="-mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-12 md:grid-rows-[230px_230px] md:overflow-visible md:px-0 md:pb-0 lg:grid-rows-[280px_280px] [&::-webkit-scrollbar]:hidden">
            {galleryImages.map((image, index) => (
              <figure
                key={image.id}
                className={cn(
                  "group relative w-[82vw] shrink-0 snap-center overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.04] shadow-[0_24px_90px_rgba(0,0,0,.26)] md:w-auto",
                  index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"
                )}
              >
                <div className={cn("relative", index === 0 ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[16/10] md:h-full md:aspect-auto")}>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes={index === 0 ? "(min-width: 1024px) 52vw, 82vw" : "(min-width: 1024px) 38vw, 82vw"}
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/56 via-transparent to-transparent opacity-80" />
                  {image.caption ? <figcaption className="absolute inset-x-5 bottom-5 text-sm font-bold text-white/86">{image.caption}</figcaption> : null}
                </div>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section id="packages" className="scroll-mt-24 border-y border-white/6 bg-[radial-gradient(circle_at_top,rgba(229,192,123,.10),transparent_32%),#070707] py-14 md:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="باقات التصوير" title="اختر باقتك" description="اختار التغطية الأنسب ليومك، ويمكنك إضافة أي خدمة تحتاجها قبل تأكيد الحجز." />
          <div className="mt-9 grid gap-4 md:mt-10 lg:grid-cols-3 lg:gap-5">
            {site.packages.map((item, index) => {
              const selected = selectedPackageId === item.id;
              const fallbackImage = site.gallery.length ? site.gallery[index % site.gallery.length]?.url : undefined;
              const imageUrl = item.imageUrl ?? fallbackImage;

              return (
                <article
                  key={item.id}
                  className={cn(
                    "group relative flex min-h-full flex-col overflow-hidden rounded-[1.6rem] border bg-[#0e0e0e] shadow-[0_26px_100px_rgba(0,0,0,.30)] transition duration-300 hover:-translate-y-1 md:rounded-[2rem]",
                    selected ? "border-[#e5c07b] shadow-[0_0_52px_rgba(229,192,123,.18)]" : item.isHighlighted ? "border-[#e5c07b]/42" : "border-white/8"
                  )}
                >
                  {imageUrl ? (
                    <div className="relative h-44 overflow-hidden md:h-60">
                      <Image src={imageUrl} alt={item.name} fill sizes="(min-width: 1024px) 30vw, 92vw" className="object-cover opacity-82 transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/18 to-transparent" />
                      {item.isHighlighted ? (
                        <span className="absolute left-4 top-4 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#e5c07b]/35 bg-black/52 px-3 text-xs font-bold text-[#f8e5ba] backdrop-blur"><Star className="size-3.5" />الأكثر اختيارًا</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl font-bold tracking-wide text-white md:text-2xl">{item.name}</h3>
                        {item.subtitle ? <p className="mt-1 text-sm font-semibold text-[#e5c07b]">{item.subtitle}</p> : null}
                      </div>
                      <p className="shrink-0 rounded-2xl border border-[#e5c07b]/18 bg-[#e5c07b]/8 px-3 py-2 text-sm font-black text-[#f8e5ba]">{item.price}</p>
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5 md:mt-6 md:space-y-3">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-sm leading-6 text-white/70">
                          <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e5c07b]/12 text-[#e5c07b]"><Check className="size-3" /></span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setSelectedPackageId(item.id)}
                      className={cn(
                        "mt-6 min-h-12 rounded-[var(--radius-control)] text-sm font-black transition hover:-translate-y-0.5 md:mt-7",
                        selected ? "bg-[linear-gradient(135deg,#fff3cf,#e5c07b,#b9822b)] text-black" : "border border-white/10 bg-white/[0.055] text-white hover:bg-white/[0.09]"
                      )}
                    >
                      {selected ? "تم الاختيار" : "اختر الباقة"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {site.extras.length ? (
        <section id="extras" className="scroll-mt-24 bg-[#050505] py-14 md:py-28">
          <div className="container-page">
            <SectionHeading eyebrow="خدمات إضافية" title="إضافات مميزة" description="أضف خدمة تصوير أو ألبوم أو فيديو حسب احتياج اليوم." />
            <div className="mt-9 grid gap-3 sm:grid-cols-2 md:mt-10 xl:grid-cols-4">
              {site.extras.map((extra) => {
                const selected = selectedExtraIds.includes(extra.id);
                const Icon = getExtraIcon(extra.iconKey);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "group min-h-32 rounded-[1.4rem] border bg-white/[0.035] p-4 text-start shadow-[0_18px_70px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:bg-white/[0.06] md:min-h-40 md:rounded-[1.6rem] md:p-5",
                      selected ? "border-[#e5c07b] bg-[#e5c07b]/9" : "border-white/8"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-11 items-center justify-center rounded-2xl border transition md:size-12",
                        selected ? "border-[#e5c07b] bg-[#e5c07b] text-black" : "border-white/10 bg-black/35 text-[#e5c07b] group-hover:border-[#e5c07b]/40"
                      )}
                    >
                      {selected ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </span>
                    <span className="mt-4 block text-sm font-black text-white md:mt-5 md:text-base">{extra.name}</span>
                    <span className="mt-2 block font-display text-lg font-bold text-[#e5c07b] md:text-xl">{extra.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="container-page scroll-mt-24 py-14 pb-28 md:py-28">
        <div className="grid overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.035] shadow-[0_35px_130px_rgba(0,0,0,.28)] md:rounded-[2.2rem] lg:grid-cols-[1.05fr_0.95fr]">
          {featuredImage ? (
            <div className="relative hidden min-h-[360px] overflow-hidden p-7 md:p-10 lg:block">
              <Image src={featuredImage} alt={site.hero.headline} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover opacity-42" />
              <div className="absolute inset-0 bg-gradient-to-l from-[#050505]/96 via-[#050505]/72 to-[#050505]/38" />
              <div className="relative z-10 max-w-lg">
                <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">جاهز نحجز يومك؟</p>
                <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">ارسل تفاصيل الحجز مباشرة</h2>
                <p className="mt-4 text-sm leading-7 text-white/68 md:text-base md:leading-8">
                  اختر الباقة والإضافات المناسبة، وسيتم تجهيز رسالة بالحجز والسعر التقريبي للتواصل معنا.
                </p>
                <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-white/70">
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">اختيار الباقة</span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">تحديد الإضافات</span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">إرسال الطلب</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-[#0b0b0b] p-5 md:p-8 lg:p-10">
            <h2 className="text-2xl font-bold">ملخص الحجز</h2>
            {selectedPackage ? (
              <div className="mt-6 space-y-4 rounded-[1.4rem] border border-white/8 bg-black/28 p-5 text-start">
                <div className="flex justify-between gap-4 border-b border-white/8 pb-3"><span className="text-sm text-white/55">الباقة</span><strong>{selectedPackage.name}</strong></div>
                {selectedExtras.length ? <div className="space-y-2 border-b border-white/8 pb-3">{selectedExtras.map((extra) => <div key={extra.id} className="flex justify-between gap-4 text-sm"><span className="text-white/65">{extra.name}</span><span className="text-[#e5c07b]">{extra.price}</span></div>)}</div> : null}
                <div className="flex items-center justify-between gap-4"><span className="font-bold">الإجمالي التقريبي</span><span className="font-display text-2xl font-bold text-[#e5c07b]">{formatTotal(total, selectedPackage.currency)}</span></div>
              </div>
            ) : (
              <p className="mt-6 rounded-[1.4rem] border border-dashed border-white/12 bg-black/24 p-5 text-sm font-bold leading-7 text-white/55">
                {EMPTY_BOOKING_MESSAGE}
              </p>
            )}
            <a
              href={bookingHref}
              onClick={handleBookingClick}
              className={cn(
                "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-black transition hover:-translate-y-0.5",
                selectedPackage ? "bg-[#25d366] text-white hover:bg-[#20b858]" : "bg-white/5 text-white/35"
              )}
            >
              <WhatsAppMark className="size-5" />
              {selectedPackage ? site.contact.callToAction : "اختار باقة أولًا"}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#020202] py-12 text-center">
        <h2 className="font-display text-3xl font-bold tracking-[0.18em] text-[#e5c07b]">{displayName}</h2>
        <div className="mt-6 flex items-center justify-center">
          <SocialLinks site={site} bookingHref={bookingHref} onBookingClick={handleBookingClick} />
        </div>
        <p className="mt-8 font-display text-xs tracking-[0.2em] text-white/30">© {new Date().getFullYear()} FrameID</p>
      </footer>

      <a
        href={bookingHref}
        onClick={handleBookingClick}
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white shadow-[0_14px_45px_rgba(37,211,102,.34)] transition hover:scale-[1.01] md:left-auto md:right-5 md:size-14 md:px-0",
          selectedPackage ? "bg-[#25d366] hover:bg-[#20b858]" : "bg-white/10 text-white/70 backdrop-blur"
        )}
        aria-label="حجز عبر واتساب"
      >
        <WhatsAppMark className="size-6 md:size-7" />
        <span className="md:hidden">{selectedPackage ? site.contact.callToAction : "اختار باقة أولًا"}</span>
      </a>
    </main>
  );
}

function ScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full px-4 py-2 font-bold transition hover:bg-white/7 hover:text-[#e5c07b]">
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
  site,
  bookingHref,
  compact = false,
  onBookingClick
}: {
  site: PublicSiteViewModel;
  bookingHref: string;
  compact?: boolean;
  onBookingClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const itemClass = compact
    ? "inline-flex size-9 items-center justify-center rounded-full border border-[#e5c07b]/18 bg-white/[0.055] text-white/72 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-[#e5c07b]/45 hover:bg-[#e5c07b]/14 hover:text-[#e5c07b]"
    : "inline-flex size-11 items-center justify-center rounded-full border border-[#e5c07b]/18 bg-white/[0.055] text-white/72 shadow-[0_10px_30px_rgba(0,0,0,.18)] transition hover:border-[#e5c07b]/45 hover:bg-[#e5c07b]/14 hover:text-[#e5c07b]";
  const instagramHref = site.contact.instagram ? normalizeSocialUrl(site.contact.instagram, "instagram") : bookingHref;
  const facebookHref = site.contact.facebook ? normalizeSocialUrl(site.contact.facebook, "facebook") : bookingHref;

  return (
    <div className="flex items-center gap-2">
      <a href={bookingHref} onClick={onBookingClick} className={itemClass} aria-label="واتساب">
        <WhatsAppMark className={compact ? "size-[1.125rem]" : "size-5"} />
      </a>
      <a href={instagramHref} onClick={instagramHref === bookingHref ? onBookingClick : undefined} target={instagramHref === bookingHref ? undefined : "_blank"} rel={instagramHref === bookingHref ? undefined : "noreferrer"} className={itemClass} aria-label="إنستجرام">
        <Instagram className={compact ? "size-4" : "size-5"} />
      </a>
      <a href={facebookHref} onClick={facebookHref === bookingHref ? onBookingClick : undefined} target={facebookHref === bookingHref ? undefined : "_blank"} rel={facebookHref === bookingHref ? undefined : "noreferrer"} className={itemClass} aria-label="فيسبوك">
        <span className={compact ? "font-display text-base font-bold" : "font-display text-lg font-bold"}>f</span>
      </a>
    </div>
  );
}

function getSiteDisplayName(site: PublicSiteViewModel) {
  const title = typeof site.metadata.title === "string" ? site.metadata.title : site.hero.headline;
  return title.split(/[—|]/u)[0]?.trim() || site.hero.headline;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h2>
      {description ? <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/58 md:text-base md:leading-8">{description}</p> : null}
    </div>
  );
}

function getExtraIcon(iconKey: string | null) {
  switch (iconKey) {
    case "video": return Video;
    case "film": return Film;
    case "team": return UserPlus;
    case "album": return Images;
    default: return Camera;
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

function normalizeSocialUrl(value: string, provider: "instagram" | "facebook") {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return provider === "instagram" ? `https://instagram.com/${value.replace(/^@/u, "")}` : `https://facebook.com/${value}`;
}

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
