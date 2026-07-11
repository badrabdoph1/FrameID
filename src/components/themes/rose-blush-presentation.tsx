import Image from "next/image";
import { Heart, Images } from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { RoseBlushSite } from "@/components/themes/rose-blush-site";

type RoseBlushPresentationProps = {
  site: PublicSiteViewModel;
};

export function RoseBlushPresentation({ site }: RoseBlushPresentationProps) {
  const heroImage = site.gallery[0] ?? null;
  const featuredImage = site.gallery[1] ?? site.gallery[0] ?? null;
  const studioSubtitle = site.contact.studioName?.trim() || "Photography";

  return (
    <div className="bg-[#fff8f4] [&>main>#home]:hidden">
      <section
        id="home"
        className="relative isolate overflow-hidden bg-[#fff8f4] pt-28 text-[#2c1810] md:min-h-screen md:pt-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(212,138,158,.22),transparent_30%),radial-gradient(circle_at_88%_76%,rgba(143,184,154,.16),transparent_34%),linear-gradient(180deg,#fff8f4,#fffaf7)]" />

        <div className="container-page relative z-10 md:hidden">
          <div className="flex min-h-[calc(100svh-7rem)] flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb89a]/25 bg-white/64 px-3.5 py-2 text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#6d9a78] shadow-[0_12px_34px_rgba(143,184,154,.1)] backdrop-blur">
                <Heart className="size-3 fill-[#6d9a78]" />
                Stories in bloom
              </span>
              <h1 className="mx-auto mt-5 max-w-[18ch] text-balance font-display text-[clamp(2.7rem,12vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.04em] text-[#2c1810]">
                {site.hero.headline}
              </h1>
              <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.22em] text-[#d48a9e]">
                {studioSubtitle}
              </p>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#6f5c55] sm:text-base">
                {site.hero.subheadline}
              </p>
            </div>

            <figure className="relative mt-6 min-h-[42svh] flex-1 overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_28px_80px_rgba(44,24,16,.14)]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/48 via-transparent to-white/5" />
              <div
                className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2.5"
                aria-label="إجراءات سريعة"
              >
                <a
                  href="#packages"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d48a9e] px-4 text-xs font-black text-white shadow-[0_16px_40px_rgba(212,138,158,.34)] transition active:scale-[0.98]"
                >
                  <Heart className="size-4 fill-current" />
                  الباقات
                </a>
                <a
                  href="#gallery"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-white/78 px-4 text-xs font-black text-[#2c1810] shadow-[0_16px_40px_rgba(44,24,16,.14)] backdrop-blur-xl transition active:scale-[0.98]"
                >
                  <Images className="size-4" />
                  الأعمال
                </a>
              </div>
            </figure>
          </div>
        </div>

        <div className="container-page relative z-10 hidden min-h-[calc(100vh-5rem)] grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] items-center gap-14 py-16 md:grid lg:gap-20">
          <div className="max-w-3xl text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb89a]/28 bg-white/58 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6d9a78] shadow-[0_16px_45px_rgba(143,184,154,.1)] backdrop-blur">
              <Heart className="size-3 fill-[#6d9a78]" />
              Fine art photography
            </span>
            <h1 className="mt-7 text-balance font-display text-6xl font-bold leading-[0.98] tracking-[-0.045em] text-[#2c1810] lg:text-8xl xl:text-[6.5rem]">
              {site.hero.headline}
            </h1>
            <p className="mt-5 font-display text-sm font-bold uppercase tracking-[0.25em] text-[#d48a9e] lg:text-base">
              {studioSubtitle}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-[#6f5c55] lg:text-xl lg:leading-10">
              {site.hero.subheadline}
            </p>
          </div>

          <div className="relative min-h-[610px]">
            <div className="absolute inset-10 rounded-[3rem] border border-[#eaddd4] bg-white/44 shadow-[0_35px_110px_rgba(44,24,16,.09)]" />
            <figure className="absolute inset-y-0 right-0 w-[76%] overflow-hidden rounded-[3rem] border border-white bg-white shadow-[0_42px_120px_rgba(44,24,16,.16)]">
              {heroImage ? (
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="45vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/42 via-transparent to-white/8" />
              <div className="absolute inset-x-6 bottom-6 flex items-center justify-end gap-3">
                <a
                  href="#packages"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#d48a9e] px-5 text-xs font-black text-white shadow-[0_18px_48px_rgba(212,138,158,.34)] transition hover:-translate-y-0.5 hover:bg-[#be778b]"
                >
                  <Heart className="size-4 fill-current" />
                  اختر باقتك
                </a>
                <a
                  href="#gallery"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-white/78 px-5 text-xs font-black text-[#2c1810] shadow-[0_18px_48px_rgba(44,24,16,.13)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <Images className="size-4" />
                  شاهد الأعمال
                </a>
              </div>
            </figure>
            {featuredImage ? (
              <figure className="absolute bottom-8 left-0 h-52 w-64 overflow-hidden rounded-[2rem] border-8 border-[#fff8f4] bg-white shadow-[0_26px_78px_rgba(44,24,16,.17)]">
                <Image
                  src={featuredImage.url}
                  alt={featuredImage.alt}
                  fill
                  sizes="22vw"
                  className="object-cover"
                />
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      <RoseBlushSite site={site} />
    </div>
  );
}
