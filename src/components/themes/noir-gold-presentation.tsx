import Image from "next/image";
import { Camera, Images } from "lucide-react";

import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { AliAhmedLuxurySite } from "@/components/themes/ali-ahmed-luxury-site";

type NoirGoldPresentationProps = {
  site: PublicSiteViewModel;
};

export function NoirGoldPresentation({ site }: NoirGoldPresentationProps) {
  const heroImage = site.gallery[0] ?? null;
  const studioSubtitle = site.contact.studioName?.trim() || "Photography";

  return (
    <div className="bg-[#050505] [&>main>#home]:hidden">
      <section
        id="home"
        className="relative isolate overflow-hidden bg-[#050505] pt-28 text-white md:min-h-screen md:pt-20"
      >
        {heroImage ? (
          <Image
            src={heroImage.url}
            alt={heroImage.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-52 md:opacity-24"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.24),rgba(5,5,5,.7)_52%,#050505_100%)] md:bg-[radial-gradient(circle_at_78%_18%,rgba(229,192,123,.16),transparent_28%),linear-gradient(90deg,#050505_0%,rgba(5,5,5,.96)_44%,rgba(5,5,5,.52)_72%,#050505_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] to-transparent" />

        <div className="container-page relative z-10 md:hidden">
          <div className="flex min-h-[calc(100svh-7rem)] flex-col justify-end pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8">
            <div className="max-w-xl text-start">
              <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.28em] text-[#e5c07b]/90">
                Portraits · Stories · Light
              </p>
              <h1 className="text-balance font-display text-[clamp(2.75rem,13vw,4.75rem)] font-bold leading-[0.98] tracking-[-0.04em] text-white drop-shadow-[0_12px_32px_rgba(0,0,0,.38)]">
                {site.hero.headline}
              </h1>
              <p className="mt-4 font-display text-sm font-bold uppercase tracking-[0.24em] text-[#e5c07b]">
                {studioSubtitle}
              </p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/74 sm:text-base">
                {site.hero.subheadline}
              </p>
            </div>

            <div className="mt-7 flex items-center gap-2.5" aria-label="إجراءات سريعة">
              <a
                href="#packages"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f4d89c]/35 bg-[#e5c07b] px-4 text-xs font-black text-black shadow-[0_14px_42px_rgba(229,192,123,.28)] backdrop-blur-xl transition active:scale-[0.98]"
              >
                <Camera className="size-4" />
                الباقات
              </a>
              <a
                href="#gallery"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/18 bg-black/38 px-4 text-xs font-bold text-white shadow-[0_14px_42px_rgba(0,0,0,.26)] backdrop-blur-xl transition active:scale-[0.98]"
              >
                <Images className="size-4" />
                الأعمال
              </a>
            </div>
          </div>
        </div>

        <div className="container-page relative z-10 hidden min-h-[calc(100vh-5rem)] grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] items-center gap-12 py-16 md:grid lg:gap-20">
          <div className="max-w-3xl text-start">
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-14 bg-[#e5c07b]/70" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[#e5c07b]/86">
                Editorial Photography
              </span>
            </div>
            <h1 className="text-balance font-display text-6xl font-bold leading-[0.94] tracking-[-0.045em] text-white lg:text-8xl xl:text-[6.75rem]">
              {site.hero.headline}
            </h1>
            <p className="mt-6 font-display text-sm font-bold uppercase tracking-[0.28em] text-[#e5c07b] lg:text-base">
              {studioSubtitle}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-white/68 lg:text-xl lg:leading-10">
              {site.hero.subheadline}
            </p>
          </div>

          <div className="relative min-h-[620px]">
            <div className="absolute inset-y-8 left-8 right-0 rounded-[2.75rem] border border-[#e5c07b]/14 bg-[#e5c07b]/[0.035]" />
            <figure className="absolute inset-y-0 left-0 right-8 overflow-hidden rounded-[2.75rem] border border-white/10 bg-[#111] shadow-[0_42px_130px_rgba(0,0,0,.48)]">
              {heroImage ? (
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="50vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-transparent to-black/8" />
              <div className="absolute inset-x-6 bottom-6 flex items-center gap-3">
                <a
                  href="#packages"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e5c07b] px-5 text-xs font-black text-black shadow-[0_18px_50px_rgba(229,192,123,.3)] transition hover:-translate-y-0.5"
                >
                  <Camera className="size-4" />
                  اختر باقتك
                </a>
                <a
                  href="#gallery"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/34 px-5 text-xs font-bold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/48"
                >
                  <Images className="size-4" />
                  شاهد الأعمال
                </a>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <AliAhmedLuxurySite site={site} />
    </div>
  );
}
