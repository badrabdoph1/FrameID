"use client";

import Image from "next/image";
import { useMemo, useState, type MouseEvent } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Film,
  Heart,
  Images,
  Instagram,
  Menu,
  Phone,
  Star,
  UserPlus,
  Video,
  X
} from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { cn } from "@/lib/utils/cn";
import {
  BookingAction,
  BookingFAB,
  PackageSelectButton,
  TemplateBookingProvider,
  useBooking,
} from "@/components/themes/template-booking-client";
import {
  formatTemplatePrice,
  normalizeContactHref,
  type NormalizedTemplateSection,
} from "@/modules/themes/template-contract";

type RoseBlushSiteProps = {
  site: PublicSiteViewModel;
};

const EMPTY_BOOKING_MESSAGE = "قم بتحديد باقة من الأعلى ليظهر ملخص الحجز هنا أولًا";

export function RoseBlushSite({ site }: RoseBlushSiteProps) {
  const displayName = site.contact.studioName?.trim() || site.hero.headline;
  const visibleSections = site.orderedSections.filter((section) => section.isVisible);
  const galleryImages = site.gallery.slice(0, 7);
  const heroImage = site.hero.imageUrl ? { url: site.hero.imageUrl, alt: site.hero.headline } : site.gallery[0] ?? null;
  const featuredImage = site.gallery[1]?.url ?? site.gallery[0]?.url ?? null;

  return (
    <TemplateBookingProvider
      packages={site.packages}
      extras={site.extras}
      siteName={displayName}
      whatsapp={site.contact.whatsapp}
      email={site.contact.email}
    >
      <RoseBlushSiteInner
        site={site}
        displayName={displayName}
        visibleSections={visibleSections}
        galleryImages={galleryImages}
        heroImage={heroImage}
        featuredImage={featuredImage}
      />
    </TemplateBookingProvider>
  );
}

function RoseBlushSiteInner({
  site,
  displayName,
  visibleSections,
  galleryImages,
  heroImage,
  featuredImage,
}: {
  site: PublicSiteViewModel;
  displayName: string;
  visibleSections: NormalizedTemplateSection[];
  galleryImages: PublicSiteViewModel["gallery"];
  heroImage: { url: string; alt: string } | null;
  featuredImage: string | null;
}) {
  const booking = useBooking();
  const selectedPackage = site.packages.find((item) => item.id === booking.selectedPackageId);
  const selectedExtras = site.extras.filter((item) => booking.selectedExtraIds.includes(item.id));
  const [menuOpen, setMenuOpen] = useState(false);

  const total = useMemo(() => {
    return (selectedPackage?.priceAmount ?? 0) + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0);
  }, [selectedExtras, selectedPackage]);

  const gallerySection = site.sections.gallery;
  const packagesSection = site.sections.packages;
  const extrasSection = site.sections.extras;

  const showGallery = site.sections.gallery?.isVisible && site.gallery.length > 0;
  const showPackages = site.sections.packages?.isVisible && site.packages.length > 0;
  const showExtras = site.sections.extras?.isVisible && site.extras.length > 0;

  const mobileHeaderCaption = site.hero.headline !== displayName
    ? site.hero.headline
    : (site.hero.subheadline || site.contact.bio || "معرض تصوير");

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  const instagramHref = site.contact.instagram ? normalizeContactHref("instagram", site.contact.instagram) : booking.bookingHref;
  const facebookHref = site.contact.facebook ? normalizeContactHref("facebook", site.contact.facebook) : booking.bookingHref;

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8f4] text-[#2c1810] selection:bg-[#d48a9e] selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#eaddd4]/80 bg-[#fff8f4]/88 shadow-[0_16px_60px_rgba(44,24,16,0.07)] backdrop-blur-2xl">
        <div className="container-page flex min-h-16 items-center justify-between gap-3 py-2 md:h-20 md:py-0">
          <button type="button" onClick={() => scrollToSection("home")} className="flex min-w-0 flex-1 flex-col items-start text-start md:max-w-[16rem]">
            <span className="max-w-full truncate font-display text-base font-bold tracking-[0.10em] text-[#d48a9e] sm:text-lg md:text-xl">
              {displayName}
            </span>
            <span className="mt-0.5 max-w-full truncate text-[0.68rem] font-bold tracking-[0.13em] text-[#8c7a74] md:hidden">
              {mobileHeaderCaption}
            </span>
          </button>

          <div className="hidden items-center gap-7 rounded-full border border-[#eaddd4]/80 bg-white/55 px-4 py-2 text-sm font-bold text-[#8c7a74] shadow-[0_18px_50px_rgba(44,24,16,0.06)] md:flex">
            <ScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            {visibleSections.filter((s) => s.type !== "hero").map((section) => (
              <ScrollButton key={section.type} onClick={() => scrollToSection(section.type)} label={section.title} />
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden md:block">
              <SocialLinks site={site} instagramHref={instagramHref} facebookHref={facebookHref} bookingHref={booking.bookingHref} compact />
            </div>
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] bg-white/70 text-[#8c7a74] shadow-[0_10px_30px_rgba(44,24,16,0.08)] md:hidden" aria-label="القائمة" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <div className="container-page flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          <MobileTopButton onClick={() => scrollToSection("home")} label="الرئيسية" />
          {visibleSections.filter((s) => s.type !== "hero").slice(0, 3).map((section) => (
            <MobileTopButton key={section.type} onClick={() => scrollToSection(section.type)} label={section.title} />
          ))}
        </div>

        {menuOpen ? (
          <div className="border-t border-[#eaddd4] bg-[#fff8f4]/96 px-6 py-3 md:hidden">
            <MobileScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            {visibleSections.filter((s) => s.type !== "hero").map((section) => (
              <MobileScrollButton key={section.type} onClick={() => scrollToSection(section.type)} label={section.title} />
            ))}
            <div className="mt-3 flex justify-center">
              <SocialLinks site={site} instagramHref={instagramHref} facebookHref={facebookHref} bookingHref={booking.bookingHref} />
            </div>
          </div>
        ) : null}
      </nav>

      <section id="home" className="relative overflow-hidden pt-28 md:min-h-screen md:pt-20">
        {heroImage ? (
          <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="100vw" className="scale-105 object-cover opacity-62" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(212,138,158,0.26),transparent_30%),radial-gradient(circle_at_86%_70%,rgba(143,184,154,0.18),transparent_34%),linear-gradient(135deg,rgba(255,248,244,0.96),rgba(255,248,244,0.68)_42%,rgba(255,248,244,0.94))]" />
        <div className="container-page relative z-10 grid min-h-[70svh] items-center gap-9 py-12 md:min-h-[calc(100vh-5rem)] md:grid-cols-[1.02fr_0.98fr] md:py-20">
          <div className="mx-auto max-w-3xl text-center md:mx-0 md:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb89a]/30 bg-white/58 px-4 py-2 text-xs font-black tracking-[0.18em] text-[#6d9a78] shadow-[0_16px_45px_rgba(143,184,154,0.10)] backdrop-blur">
              <Heart className="size-3 fill-[#6d9a78]" />
              {site.hero.eyebrow || String(gallerySection?.settings.eyebrow ?? "تصوير فني راقي")}
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-4xl font-bold leading-tight text-[#2c1810] sm:text-5xl md:mx-0 md:text-7xl lg:text-8xl">
              {site.hero.headline}
            </h1>
            {displayName !== site.hero.headline ? (
              <p className="mx-auto mt-4 max-w-2xl font-display text-sm font-bold tracking-[0.22em] text-[#d48a9e] md:mx-0 md:text-base">
                {displayName}
              </p>
            ) : null}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6f5c55] md:mx-0 md:text-xl md:leading-10">
              {site.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <a href={site.hero.cta.target === "whatsapp" && site.contact.whatsapp ? normalizeContactHref("whatsapp", site.contact.whatsapp) : `#${site.hero.cta.target === "whatsapp" ? "contact" : site.hero.cta.target}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[#d48a9e] px-8 text-sm font-black text-white no-underline shadow-[0_18px_45px_rgba(212,138,158,0.26)] transition hover:-translate-y-0.5 hover:bg-[#b87084]">
                {site.hero.cta.label}
                <ChevronDown className="size-4" />
              </a>
              <button type="button" onClick={() => scrollToSection("gallery")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[#e0c9bf] bg-white/72 px-8 text-sm font-black text-[#2c1810] shadow-[0_14px_40px_rgba(44,24,16,0.06)] transition hover:-translate-y-0.5 hover:bg-white">
                <Images className="size-4" />
                شاهد الأعمال
              </button>
            </div>
          </div>

          <div className="relative hidden min-h-[560px] md:block">
            <div className="absolute inset-8 rounded-[3rem] border border-[#eaddd4] bg-white/44 shadow-[0_35px_120px_rgba(44,24,16,0.12)]" />
            {heroImage ? (
              <figure className="absolute inset-y-0 right-0 w-[72%] overflow-hidden rounded-[3rem] border border-white bg-white shadow-[0_40px_110px_rgba(44,24,16,0.16)]">
                <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="44vw" className="object-cover" />
              </figure>
            ) : null}
            {featuredImage ? (
              <figure className="absolute bottom-8 left-0 h-56 w-72 overflow-hidden rounded-[2rem] border-8 border-[#fff8f4] bg-white shadow-[0_25px_80px_rgba(44,24,16,0.18)]">
                <Image src={featuredImage} alt={site.hero.headline} fill sizes="24vw" className="object-cover" />
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      {showGallery ? (
        <section id="gallery" className="bg-white py-16 md:py-28">
          <div className="container-page">
            <SectionHeading eyebrow={String(gallerySection?.settings.eyebrow ?? "معرض الأعمال")} title={gallerySection?.title ?? "الأعمال"} description={gallerySection?.description ?? undefined} />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-12 md:grid-rows-[230px_230px] md:gap-4 lg:grid-rows-[280px_280px]">
              {galleryImages.map((image, index) => (
                <figure key={image.id} className={cn("group relative overflow-hidden rounded-[1.6rem] border border-[#eaddd4]/70 bg-white shadow-[0_24px_70px_rgba(44,24,16,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(212,138,158,0.14)]", index === 0 ? "sm:col-span-2 md:col-span-6 md:row-span-2" : index === 1 ? "md:col-span-6" : "md:col-span-3")}> 
                  <div className={cn("relative", index === 0 ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[4/5] md:h-full md:aspect-auto")}>
                    <Image src={image.url} alt={image.alt} fill sizes={index === 0 ? "(min-width: 1024px) 48vw, 92vw" : "(min-width: 1024px) 24vw, 92vw"} className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/36 via-transparent to-transparent opacity-70" />
                    {image.caption ? <figcaption className="absolute inset-x-5 bottom-5 text-sm font-black text-white drop-shadow">{image.caption}</figcaption> : null}
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showPackages ? (
      <section id="packages" className="bg-[#fff8f4] py-16 md:py-28">
        <div className="container-page">
          <SectionHeading eyebrow={String(packagesSection?.settings.eyebrow ?? "باقات التصوير")} title={packagesSection?.title ?? "الباقات"} description={packagesSection?.description ?? undefined} />
          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            {site.packages.map((item, index) => {
              const selected = booking.selectedPackageId === item.id;
              const galleryFallback = site.gallery.length ? site.gallery[index % site.gallery.length]?.url : null;
              const imageUrl = item.imageUrl ?? galleryFallback;
              return (
                <article key={item.id} className={cn("group relative flex min-h-full flex-col overflow-hidden rounded-[1.8rem] border bg-white shadow-[0_20px_80px_rgba(44,24,16,0.07)] transition duration-500 hover:-translate-y-1", selected ? "border-[#d48a9e] shadow-[0_26px_90px_rgba(212,138,158,0.22)]" : item.isHighlighted ? "border-[#d48a9e]/45" : "border-[#eaddd4]/75")}>
                  {imageUrl ? (
                    <div className="relative h-48 overflow-hidden md:h-60">
                      <Image src={imageUrl} alt={item.name} fill sizes="(min-width: 1024px) 31vw, 92vw" className="object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-2xl font-bold tracking-wide text-[#2c1810]">{item.name}</h3>
                          {item.isHighlighted ? <span className="inline-flex items-center gap-1 rounded-full border border-[#d48a9e]/30 bg-[#f5e4ea] px-2.5 py-0.5 text-xs font-black text-[#d48a9e]"><Star className="size-3 fill-[#d48a9e]" />الأكثر طلباً</span> : null}
                        </div>
                        {item.subtitle ? <p className="mt-1 text-sm font-bold text-[#6d9a78]">{item.subtitle}</p> : null}
                      </div>
                      <p className="shrink-0 rounded-2xl border border-[#d48a9e]/16 bg-[#f5e4ea] px-3 py-2 text-sm font-black text-[#b87084]">{item.price}</p>
                    </div>
                    <ul className="mt-5 flex-1 space-y-3">
                      {item.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-[#6f5c55]"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0e6]"><Check className="size-3 text-[#6d9a78]" /></span><span>{feature}</span></li>)}
                    </ul>
                    <PackageSelectButton id={item.id} variant="rose" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      ) : null}

      {showExtras ? (
        <section id="extras" className="bg-white py-16 md:py-28">
          <div className="container-page">
            <SectionHeading eyebrow={String(extrasSection?.settings.eyebrow ?? "خدمات إضافية")} title={extrasSection?.title ?? "الإضافات"} description={extrasSection?.description ?? undefined} />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {site.extras.map((extra) => {
                const Icon = getExtraIcon(extra.iconKey);
                return (
                  <ExtraItem key={extra.id} extra={extra} Icon={Icon} />
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="bg-[#fff8f4] py-16 pb-28 md:py-28">
        <div className="container-page">
          <div className="grid overflow-hidden rounded-[2rem] border border-[#eaddd4]/80 bg-white shadow-[0_35px_120px_rgba(44,24,16,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
            {featuredImage ? (
              <div className="relative hidden min-h-[470px] overflow-hidden lg:block">
                <Image src={featuredImage} alt={site.hero.headline} fill sizes="46vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-white/96 via-white/55 to-transparent" />
                <div className="relative z-10 flex h-full max-w-md flex-col justify-end p-10">
                  <p className="font-display text-xs tracking-[0.28em] text-[#d48a9e]">احجز جلستك</p>
                  <h2 className="mt-4 text-4xl font-bold leading-tight text-[#2c1810]">لنخلق شيئاً جميلاً معاً</h2>
                  <p className="mt-4 text-sm leading-7 text-[#6f5c55]">اختر الباقة والإضافات المناسبة، وسيتم تجهيز رسالة بالحجز والسعر التقريبي للتواصل.</p>
                </div>
              </div>
            ) : null}
            <div className="p-5 md:p-8 lg:p-10">
              <p className="font-display text-xs tracking-[0.28em] text-[#6d9a78]">ملخص الحجز</p>
              <h2 className="mt-3 text-3xl font-bold text-[#2c1810] md:text-5xl">تفاصيل طلبك</h2>
              {selectedPackage ? (
                <div className="mt-6 space-y-4 rounded-[1.5rem] bg-[#fff8f4] p-5 text-start">
                  <div className="flex items-start justify-between gap-4 border-b border-[#eaddd4] pb-3"><span className="text-sm text-[#8c7a74]">الباقة</span><div className="text-left"><strong className="block text-[#2c1810]">{selectedPackage.name}</strong>{selectedPackage.subtitle ? <span className="text-xs text-[#6d9a78]">{selectedPackage.subtitle}</span> : null}</div></div>
                  {selectedExtras.length ? <div className="space-y-2 border-b border-[#eaddd4] pb-3">{selectedExtras.map((extra) => <div key={extra.id} className="flex justify-between gap-4 text-sm"><span className="text-[#8c7a74]">{extra.name}</span><span className="font-bold text-[#d48a9e]">{extra.price}</span></div>)}</div> : null}
                  <div className="flex items-center justify-between gap-4 pt-1"><span className="font-black text-[#2c1810]">الإجمالي التقريبي</span><span className="font-display text-2xl font-bold text-[#d48a9e]">{formatTemplatePrice(total, selectedPackage.currency)}</span></div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-[#eaddd4] bg-[#fff8f4] p-8"><Heart className="size-8 text-[#d48a9e]/45" /><p className="text-center text-sm font-bold leading-7 text-[#8c7a74]">{EMPTY_BOOKING_MESSAGE}</p></div>
              )}
              <BookingAction label={site.contact.callToAction} variant="rose" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#eaddd4] bg-[#f4f8f3] py-12 text-center">
        <div className="container-page">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3"><span className="h-px w-8 bg-[#d48a9e]/40" /><span className="font-display text-xs tracking-[0.3em] text-[#8fb89a]">FRAMEID</span><span className="h-px w-8 bg-[#d48a9e]/40" /></div>
          <h2 className="font-display text-3xl font-bold tracking-[0.08em] text-[#d48a9e]">{displayName}</h2>
          <div className="mt-6 flex items-center justify-center">
            <SocialLinks site={site} instagramHref={instagramHref} facebookHref={facebookHref} bookingHref={booking.bookingHref} />
          </div>
          <p className="mt-8 font-display text-xs tracking-[0.2em] text-[#8c7a74]/50">&copy; {new Date().getFullYear()} FrameID</p>
        </div>
      </footer>

      <BookingFAB variant="rose" />
    </main>
  );
}

function ExtraItem({ extra, Icon }: { extra: PublicSiteViewModel["extras"][number]; Icon: typeof Camera }) {
  const booking = useBooking();
  const selected = booking.selectedExtraIds.includes(extra.id);
  return (
    <button key={extra.id} type="button" onClick={() => booking.toggleExtra(extra.id)} className={cn("group min-h-32 rounded-[1.5rem] border p-5 text-start shadow-[0_18px_60px_rgba(44,24,16,0.06)] transition duration-300 hover:-translate-y-0.5", selected ? "border-[#8fb89a] bg-[#f4f8f3] shadow-[0_20px_70px_rgba(143,184,154,0.16)]" : "border-[#eaddd4]/70 bg-white hover:border-[#d48a9e]/45")}> 
      <span className={cn("inline-flex size-12 items-center justify-center rounded-2xl transition", selected ? "bg-[#8fb89a] text-white" : "bg-[#f5e4ea] text-[#d48a9e] group-hover:bg-[#d48a9e] group-hover:text-white")}>{selected ? <Check className="size-5" /> : <Icon className="size-5" />}</span>
      <span className="mt-5 block font-black text-[#2c1810]">{extra.name}</span>
      <span className="mt-2 block font-display text-xl font-bold text-[#d48a9e]">{extra.price}</span>
    </button>
  );
}

function ScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="transition-colors hover:text-[#d48a9e]">{label}</button>;
}

function MobileTopButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-[#eaddd4] bg-white/66 px-3 text-xs font-black text-[#8c7a74] transition hover:bg-[#f5e4ea] hover:text-[#d48a9e]">{label}</button>;
}

function MobileScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="block w-full rounded-lg px-3 py-3 text-center text-sm font-bold text-[#8c7a74] hover:bg-[#f5e4ea] hover:text-[#d48a9e]">{label}</button>;
}

function SocialLinks({
  site,
  instagramHref,
  facebookHref,
  bookingHref,
  compact = false,
}: {
  site: PublicSiteViewModel;
  instagramHref: string;
  facebookHref: string;
  bookingHref: string;
  compact?: boolean;
}) {
  const itemClass = compact
    ? "inline-flex size-9 items-center justify-center rounded-full border border-[#eaddd4] bg-white/70 text-[#8c7a74] shadow-[0_10px_30px_rgba(44,24,16,0.08)] transition hover:border-[#d48a9e] hover:text-[#d48a9e]"
    : "inline-flex size-11 items-center justify-center rounded-full border border-[#eaddd4] bg-white text-[#8c7a74] shadow-[0_10px_30px_rgba(44,24,16,0.08)] transition hover:border-[#d48a9e] hover:text-[#d48a9e]";

  return (
    <div className="flex items-center gap-2">
      <a href={bookingHref} className={itemClass} aria-label="حجز">
        <Phone className={compact ? "size-4" : "size-5"} />
      </a>
      {site.contact.instagram ? (
        <a href={instagramHref} target="_blank" rel="noreferrer" className={itemClass} aria-label="إنستجرام">
          <Instagram className={compact ? "size-4" : "size-5"} />
        </a>
      ) : null}
      {site.contact.facebook ? (
        <a href={facebookHref} target="_blank" rel="noreferrer" className={itemClass} aria-label="فيسبوك">
          <span className={compact ? "font-display text-base font-bold" : "font-display text-lg font-bold"}>f</span>
        </a>
      ) : null}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[#d48a9e]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-[#2c1810] md:text-5xl">{title}</h2>
      {description ? <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#8c7a74] md:text-base md:leading-8">{description}</p> : null}
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
