"use client";

import Image from "next/image";
import { useMemo, useState, type MouseEvent } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Film,
  Heart,
  Images,
  Instagram,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  UserPlus,
  Video,
  X
} from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { cn } from "@/lib/utils/cn";
import {
  createThemeBookingHref,
  formatThemeTotal,
  getThemeDisplayName,
  getThemeFeaturedImage,
  getThemeHeroImage,
  getThemeMobileCaption,
  getThemeSectionCopy,
  isThemeSectionVisible,
  normalizeThemeSocialUrl
} from "@/components/themes/theme-contract";

type RoseBlushSiteProps = {
  site: PublicSiteViewModel;
};

const EMPTY_BOOKING_MESSAGE = "قم بتحديد باقة من الأعلى ليظهر ملخص الحجز هنا أولًا";

export function RoseBlushSite({ site }: RoseBlushSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  const selectedPackage = site.packages.find((item) => item.id === selectedPackageId);
  const selectedExtras = site.extras.filter((item) => selectedExtraIds.includes(item.id));
  const galleryImages = site.gallery.slice(0, 7);
  const heroImage = getThemeHeroImage(site);
  const featuredImage = getThemeFeaturedImage(site);
  const displayName = getThemeDisplayName(site);
  const mobileHeaderCaption = getThemeMobileCaption(site, displayName);
  const gallerySection = getThemeSectionCopy(site, "gallery", {
    title: "لحظات لا تُنسى",
    description: "مجموعة مختارة من أعمال التصوير كما تظهر من معرض العميل نفسه."
  });
  const packagesSection = getThemeSectionCopy(site, "packages", {
    title: "اختر باقتك",
    description: "اختار التغطية الأنسب ليومك، ويمكنك إضافة أي خدمة تحتاجها قبل تأكيد الحجز."
  });
  const extrasSection = getThemeSectionCopy(site, "extras", {
    title: "لمسة إضافية",
    description: "أضف خدمة تصوير أو ألبوم أو فيديو حسب احتياج اليوم."
  });
  const showGallery = isThemeSectionVisible(site, "gallery") && site.gallery.length > 0;
  const showPackages = isThemeSectionVisible(site, "packages") && site.packages.length > 0;
  const showExtras = isThemeSectionVisible(site, "extras") && site.extras.length > 0;

  const total = useMemo(() => {
    return (selectedPackage?.priceAmount ?? 0) + selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0);
  }, [selectedExtras, selectedPackage]);

  const bookingHref = createThemeBookingHref({ site, selectedPackage, selectedExtras, total });

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
    <main className="min-h-screen overflow-hidden bg-[#fff8f4] text-[#2c1810] selection:bg-[#d48a9e] selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#eaddd4]/80 bg-[#fff8f4]/92 shadow-[0_8px_40px_rgba(44,24,16,0.06)] backdrop-blur-2xl">
        <div className="container-page flex min-h-16 items-center justify-between gap-3 py-2 md:h-20 md:py-0">
          <button type="button" onClick={() => scrollToSection("home")} className="flex min-w-0 flex-1 flex-col items-start text-start md:max-w-[16rem]">
            <span className="max-w-full truncate font-display text-base font-bold tracking-[0.10em] text-[#d48a9e] sm:text-lg md:text-xl">
              {displayName}
            </span>
            <span className="mt-0.5 max-w-full truncate text-[0.68rem] font-bold tracking-[0.13em] text-[#8c7a74] md:hidden">
              {mobileHeaderCaption}
            </span>
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-[#eaddd4]/80 bg-white/60 px-2 py-1.5 text-sm font-bold text-[#8c7a74] shadow-[0_12px_40px_rgba(44,24,16,0.05)] md:flex">
            <ScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <ScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <ScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <ScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <ScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden md:block">
              <SocialLinks site={site} bookingHref={bookingHref} compact onBookingClick={handleBookingClick} />
            </div>
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] bg-white/70 text-[#8c7a74] shadow-[0_8px_24px_rgba(44,24,16,0.08)] transition hover:bg-white md:hidden" aria-label="القائمة" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        <div className="container-page flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          <MobileTopButton onClick={() => scrollToSection("home")} label="الرئيسية" />
          <MobileTopButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
          <MobileTopButton onClick={() => scrollToSection("packages")} label="الباقات" />
          <MobileTopButton onClick={() => scrollToSection("contact")} label="الحجز" />
        </div>

        {menuOpen ? (
          <div className="border-t border-[#eaddd4] bg-[#fff8f4]/98 px-6 py-4 shadow-[0_20px_60px_rgba(44,24,16,0.08)] md:hidden">
            <MobileScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <MobileScrollButton onClick={() => scrollToSection("gallery")} label="الأعمال" />
            <MobileScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <MobileScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <MobileScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
            <div className="mt-4 flex justify-center border-t border-[#eaddd4]/60 pt-4">
              <SocialLinks site={site} bookingHref={bookingHref} onBookingClick={handleBookingClick} />
            </div>
          </div>
        ) : null}
      </nav>

      <section id="home" className="relative overflow-hidden pt-24 md:min-h-screen md:pt-20">
        {heroImage ? (
          <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="100vw" className="scale-105 object-cover opacity-55 md:opacity-65" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,138,158,0.18),transparent_50%),radial-gradient(circle_at_86%_70%,rgba(143,184,154,0.12),transparent_40%),linear-gradient(180deg,rgba(255,248,244,0.98),rgba(255,248,244,0.72)_45%,rgba(255,248,244,0.96))]" />
        
        <div className="container-page relative z-10 grid min-h-[75svh] items-end gap-8 pb-12 pt-8 md:min-h-[calc(100vh-5rem)] md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-0 md:pt-20">
          <div className="mx-auto max-w-3xl text-center md:mx-0 md:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb89a]/30 bg-white/70 px-4 py-2 text-xs font-black tracking-[0.18em] text-[#6d9a78] shadow-[0_12px_35px_rgba(143,184,154,0.12)] backdrop-blur-sm">
              <Heart className="size-3 fill-[#6d9a78]" />
              تصوير فني راقي
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-[clamp(2.5rem,11vw,5.5rem)] font-bold leading-[0.96] tracking-[-0.02em] text-[#2c1810] md:mx-0">
              {site.hero.headline}
            </h1>
            {displayName !== site.hero.headline ? (
              <p className="mx-auto mt-5 max-w-2xl font-display text-sm font-bold tracking-[0.22em] text-[#d48a9e] md:mx-0 md:text-base">
                {displayName}
              </p>
            ) : null}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6f5c55] md:mx-0 md:text-xl md:leading-10">
              {site.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:mt-10 md:justify-start">
              <button type="button" onClick={() => scrollToSection("packages")} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[#d48a9e] px-8 text-sm font-black text-white shadow-[0_16px_40px_rgba(212,138,158,0.30)] transition hover:-translate-y-0.5 hover:bg-[#c77a8e] hover:shadow-[0_20px_50px_rgba(212,138,158,0.38)]">
                اختر باقتك
                <ChevronDown className="size-4 transition group-hover:translate-y-0.5" />
              </button>
              <button type="button" onClick={() => scrollToSection("gallery")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[#e0c9bf] bg-white/80 px-8 text-sm font-black text-[#2c1810] shadow-[0_12px_32px_rgba(44,24,16,0.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_rgba(44,24,16,0.10)]">
                <Images className="size-4" />
                شاهد الأعمال
              </button>
            </div>
          </div>

          <div className="relative hidden min-h-[580px] md:block">
            <div className="absolute inset-6 rounded-[3rem] border border-[#eaddd4]/60 bg-white/50 shadow-[0_40px_120px_rgba(44,24,16,0.10)]" />
            {heroImage ? (
              <figure className="absolute inset-y-0 right-0 w-[74%] overflow-hidden rounded-[3rem] border-[6px] border-[#fff8f4] bg-white shadow-[0_45px_130px_rgba(44,24,16,0.18)]">
                <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="44vw" className="object-cover" />
              </figure>
            ) : null}
            {featuredImage ? (
              <figure className="absolute bottom-6 left-0 h-60 w-72 overflow-hidden rounded-[2rem] border-[6px] border-[#fff8f4] bg-white shadow-[0_30px_90px_rgba(44,24,16,0.20)]">
                <Image src={featuredImage} alt={site.hero.headline} fill sizes="24vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/20 to-transparent" />
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      {showGallery ? (
        <section id="gallery" className="bg-white py-16 md:py-28">
          <div className="container-page">
            <SectionHeading eyebrow="معرض الأعمال" title={gallerySection.title} description={gallerySection.description ?? undefined} />
            
            <div className="-mx-4 mt-10 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-12 md:grid-rows-[240px_240px] md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-rows-[300px_300px] [&::-webkit-scrollbar]:hidden">
              {galleryImages.map((image, index) => (
                <figure
                  key={image.id}
                  className={cn(
                    "group relative w-[78vw] shrink-0 snap-center overflow-hidden rounded-[1.8rem] border border-[#eaddd4]/70 bg-white shadow-[0_20px_60px_rgba(44,24,16,0.08)] transition duration-500 hover:shadow-[0_28px_80px_rgba(212,138,158,0.16)] md:w-auto",
                    index === 0 ? "md:col-span-7 md:row-span-2" : index === 1 ? "md:col-span-5" : "md:col-span-3"
                  )}
                >
                  <div className={cn("relative", index === 0 ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[4/5] md:h-full md:aspect-auto")}>
                    <Image src={image.url} alt={image.alt} fill sizes={index === 0 ? "(min-width: 1024px) 52vw, 78vw" : "(min-width: 1024px) 26vw, 78vw"} className="object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/40 via-transparent to-transparent opacity-60 transition group-hover:opacity-80" />
                    {image.caption ? <figcaption className="absolute inset-x-5 bottom-5 text-sm font-black text-white drop-shadow-lg">{image.caption}</figcaption> : null}
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
          <SectionHeading eyebrow="باقات التصوير" title={packagesSection.title} description={packagesSection.description ?? undefined} />
          
          <div className="-mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            {site.packages.map((item, index) => {
              const selected = selectedPackageId === item.id;
              const galleryFallback = site.gallery.length ? site.gallery[index % site.gallery.length]?.url : null;
              const imageUrl = item.imageUrl ?? galleryFallback;
              return (
                <article
                  key={item.id}
                  className={cn(
                    "group relative flex min-h-full w-[86vw] shrink-0 snap-center flex-col overflow-hidden rounded-[2rem] border bg-white shadow-[0_24px_80px_rgba(44,24,16,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_32px_100px_rgba(212,138,158,0.18)] md:w-auto",
                    selected ? "border-[#d48a9e] shadow-[0_30px_100px_rgba(212,138,158,0.26)]" : item.isHighlighted ? "border-[#d48a9e]/50" : "border-[#eaddd4]/75"
                  )}
                >
                  {imageUrl ? (
                    <div className="relative h-52 overflow-hidden md:h-64">
                      <Image src={imageUrl} alt={item.name} fill sizes="(min-width: 1024px) 31vw, 86vw" className="object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />
                      {item.isHighlighted ? (
                        <span className="absolute left-4 top-4 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#d48a9e]/30 bg-white/90 px-3 text-xs font-black text-[#d48a9e] shadow-sm backdrop-blur">
                          <Star className="size-3 fill-[#d48a9e]" />
                          الأكثر طلباً
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl font-bold tracking-wide text-[#2c1810]">{item.name}</h3>
                        {item.subtitle ? <p className="mt-1 text-sm font-bold text-[#6d9a78]">{item.subtitle}</p> : null}
                      </div>
                      <p className="shrink-0 rounded-2xl border border-[#d48a9e]/16 bg-[#f5e4ea] px-3 py-2 text-sm font-black text-[#b87084]">{item.price}</p>
                    </div>
                    <ul className="mt-5 flex-1 space-y-3">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-sm leading-6 text-[#6f5c55]">
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0e6]">
                            <Check className="size-3 text-[#6d9a78]" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setSelectedPackageId(item.id)}
                      className={cn(
                        "mt-6 min-h-12 rounded-[var(--radius-control)] text-sm font-black transition hover:-translate-y-0.5",
                        selected ? "bg-[#d48a9e] text-white shadow-[0_16px_40px_rgba(212,138,158,0.28)]" : "border border-[#eaddd4] bg-white text-[#2c1810] hover:border-[#d48a9e] hover:text-[#d48a9e]"
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
      ) : null}

      {showExtras ? (
        <section id="extras" className="bg-white py-16 md:py-28">
          <div className="container-page">
            <SectionHeading eyebrow="خدمات إضافية" title={extrasSection.title} description={extrasSection.description ?? undefined} />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {site.extras.map((extra) => {
                const selected = selectedExtraIds.includes(extra.id);
                const Icon = getExtraIcon(extra.iconKey);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "group min-h-36 rounded-[1.6rem] border p-5 text-start shadow-[0_16px_50px_rgba(44,24,16,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(143,184,154,0.14)]",
                      selected ? "border-[#8fb89a] bg-[#f4f8f3] shadow-[0_22px_70px_rgba(143,184,154,0.20)]" : "border-[#eaddd4]/70 bg-white hover:border-[#d48a9e]/50"
                    )}
                  >
                    <span className={cn(
                      "inline-flex size-12 items-center justify-center rounded-2xl transition",
                      selected ? "bg-[#8fb89a] text-white" : "bg-[#f5e4ea] text-[#d48a9e] group-hover:bg-[#d48a9e] group-hover:text-white"
                    )}>
                      {selected ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </span>
                    <span className="mt-5 block font-black text-[#2c1810]">{extra.name}</span>
                    <span className="mt-2 block font-display text-xl font-bold text-[#d48a9e]">{extra.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="bg-[#fff8f4] py-16 pb-28 md:py-28">
        <div className="container-page">
          <div className="grid overflow-hidden rounded-[2.2rem] border border-[#eaddd4]/80 bg-white shadow-[0_40px_130px_rgba(44,24,16,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
            {featuredImage ? (
              <div className="relative hidden min-h-[500px] overflow-hidden lg:block">
                <Image src={featuredImage} alt={site.hero.headline} fill sizes="46vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-white via-white/60 to-transparent" />
                <div className="relative z-10 flex h-full max-w-md flex-col justify-end p-10">
                  <p className="font-display text-xs tracking-[0.28em] text-[#d48a9e]">احجز جلستك</p>
                  <h2 className="mt-4 text-4xl font-bold leading-tight text-[#2c1810]">لنخلق شيئاً جميلاً معاً</h2>
                  <p className="mt-4 text-sm leading-7 text-[#6f5c55]">اختر الباقة والإضافات المناسبة، وسيتم تجهيز رسالة بالحجز والسعر التقريبي للتواصل.</p>
                </div>
              </div>
            ) : null}
            <div className="p-6 md:p-8 lg:p-10">
              <p className="font-display text-xs tracking-[0.28em] text-[#6d9a78]">ملخص الحجز</p>
              <h2 className="mt-3 text-3xl font-bold text-[#2c1810] md:text-4xl">تفاصيل طلبك</h2>
              {selectedPackage ? (
                <div className="mt-6 space-y-4 rounded-[1.6rem] bg-[#fff8f4] p-5 text-start">
                  <div className="flex items-start justify-between gap-4 border-b border-[#eaddd4] pb-3">
                    <span className="text-sm text-[#8c7a74]">الباقة</span>
                    <div className="text-left">
                      <strong className="block text-[#2c1810]">{selectedPackage.name}</strong>
                      {selectedPackage.subtitle ? <span className="text-xs text-[#6d9a78]">{selectedPackage.subtitle}</span> : null}
                    </div>
                  </div>
                  {selectedExtras.length ? (
                    <div className="space-y-2 border-b border-[#eaddd4] pb-3">
                      {selectedExtras.map((extra) => (
                        <div key={extra.id} className="flex justify-between gap-4 text-sm">
                          <span className="text-[#8c7a74]">{extra.name}</span>
                          <span className="font-bold text-[#d48a9e]">{extra.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="font-black text-[#2c1810]">الإجمالي التقريبي</span>
                    <span className="font-display text-2xl font-bold text-[#d48a9e]">{formatThemeTotal(total, selectedPackage.currency)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-[1.6rem] border border-dashed border-[#eaddd4] bg-[#fff8f4] p-8">
                  <Heart className="size-8 text-[#d48a9e]/45" />
                  <p className="text-center text-sm font-bold leading-7 text-[#8c7a74]">{EMPTY_BOOKING_MESSAGE}</p>
                </div>
              )}
              <a
                href={bookingHref}
                onClick={handleBookingClick}
                className={cn(
                  "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-black transition hover:-translate-y-0.5",
                  selectedPackage ? "bg-[#25d366] text-white shadow-[0_18px_50px_rgba(37,211,102,0.28)] hover:bg-[#20b858]" : "bg-[#eaddd4] text-white/75"
                )}
              >
                <MessageCircle className="size-5" />
                {selectedPackage ? site.contact.callToAction : "اختار باقة أولًا"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#eaddd4] bg-[#f4f8f3] py-14 text-center">
        <div className="container-page">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#d48a9e]/40" />
            <span className="font-display text-xs tracking-[0.3em] text-[#8fb89a]">FRAMEID</span>
            <span className="h-px w-10 bg-[#d48a9e]/40" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-[0.08em] text-[#d48a9e]">{displayName}</h2>
          <div className="mt-6 flex items-center justify-center">
            <SocialLinks site={site} bookingHref={bookingHref} onBookingClick={handleBookingClick} />
          </div>
          <p className="mt-8 font-display text-xs tracking-[0.2em] text-[#8c7a74]/50">© {new Date().getFullYear()} FrameID</p>
        </div>
      </footer>

      {selectedPackage ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-auto">
          <a
            href={bookingHref}
            onClick={handleBookingClick}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-black text-white shadow-[0_16px_50px_rgba(37,211,102,0.35)] transition hover:-translate-y-0.5 hover:bg-[#20b858] md:min-h-14 md:rounded-full md:px-8"
          >
            <MessageCircle className="size-5" />
            <span className="md:hidden">{site.contact.callToAction}</span>
            <span className="hidden md:inline">احجز الآن</span>
          </a>
        </div>
      ) : null}
    </main>
  );
}

function ScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full px-4 py-2 transition-colors hover:bg-[#f5e4ea] hover:text-[#d48a9e]">
      {label}
    </button>
  );
}

function MobileTopButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-[#eaddd4] bg-white/70 px-3.5 text-xs font-black text-[#8c7a74] shadow-[0_6px_20px_rgba(44,24,16,0.05)] transition hover:bg-[#f5e4ea] hover:text-[#d48a9e]">
      {label}
    </button>
  );
}

function MobileScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-xl px-3 py-3.5 text-center text-sm font-bold text-[#8c7a74] transition hover:bg-[#f5e4ea] hover:text-[#d48a9e]">
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
    ? "inline-flex size-9 items-center justify-center rounded-full border border-[#eaddd4] bg-white/80 text-[#8c7a74] shadow-[0_8px_24px_rgba(44,24,16,0.06)] transition hover:border-[#d48a9e] hover:text-[#d48a9e]"
    : "inline-flex size-11 items-center justify-center rounded-full border border-[#eaddd4] bg-white text-[#8c7a74] shadow-[0_10px_30px_rgba(44,24,16,0.08)] transition hover:border-[#d48a9e] hover:text-[#d48a9e]";
  const instagramHref = site.contact.instagram ? normalizeThemeSocialUrl(site.contact.instagram, "instagram") : bookingHref;
  const facebookHref = site.contact.facebook ? normalizeThemeSocialUrl(site.contact.facebook, "facebook") : bookingHref;

  return (
    <div className="flex items-center gap-2">
      <a href={bookingHref} onClick={onBookingClick} className={itemClass} aria-label="حجز">
        <Phone className={compact ? "size-4" : "size-5"} />
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
