"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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

type RoseBlushSiteProps = {
  site: PublicSiteViewModel;
};

export function RoseBlushSite({ site }: RoseBlushSiteProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    site.packages[0]?.id ?? null
  );
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  const selectedPackage = site.packages.find(
    (item) => item.id === selectedPackageId
  );
  const selectedExtras = site.extras.filter((item) =>
    selectedExtraIds.includes(item.id)
  );
  const total = useMemo(() => {
    return (
      (selectedPackage?.priceAmount ?? 0) +
      selectedExtras.reduce((sum, item) => sum + item.priceAmount, 0)
    );
  }, [selectedExtras, selectedPackage]);
  const bookingHref = createBookingHref({
    site,
    selectedPackage,
    selectedExtras,
    total
  });

  function toggleExtra(extraId: string) {
    setSelectedExtraIds((current) =>
      current.includes(extraId)
        ? current.filter((id) => id !== extraId)
        : [...current, extraId]
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf6f2] text-[#2c1810] selection:bg-[#d48a9e] selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#eaddd4] bg-[#faf6f2]/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <a
            href="#home"
            className="font-display text-xl font-bold tracking-[0.08em] text-[#d48a9e]"
          >
            {site.hero.headline}
          </a>
          <div className="hidden items-center gap-8 text-sm text-[#8c7a74] md:flex">
            <a href="#home" className="hover:text-[#d48a9e] transition-colors">الرئيسية</a>
            <a href="#gallery" className="hover:text-[#d48a9e] transition-colors">الأعمال</a>
            <a href="#packages" className="hover:text-[#d48a9e] transition-colors">الباقات</a>
            <a href="#extras" className="hover:text-[#d48a9e] transition-colors">الإضافات</a>
            <a href="#contact" className="hover:text-[#d48a9e] transition-colors">الحجز</a>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] text-[#8c7a74] md:hidden"
            aria-label="القائمة"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-[#eaddd4] bg-[#faf6f2]/95 px-6 py-3 md:hidden">
            {[
              ["الرئيسية", "#home"],
              ["الأعمال", "#gallery"],
              ["الباقات", "#packages"],
              ["الإضافات", "#extras"],
              ["الحجز", "#contact"]
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="block rounded-lg px-3 py-3 text-center text-sm text-[#8c7a74] hover:bg-[#f5e4ea] hover:text-[#d48a9e]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </nav>

      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        <Image
          src={site.hero.imageUrl}
          alt={site.hero.headline}
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(212,138,158,0.25),rgba(143,184,154,0.2)_50%,rgba(250,246,242,0.92)_100%)]" />
        <div className="absolute -left-20 -top-20 size-96 rounded-full bg-[#d48a9e]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-[28rem] rounded-full bg-[#8fb89a]/10 blur-3xl" />
        <div className="container-page relative z-10 pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#8fb89a]/30 bg-[#e8f0e6]/60 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#6d9a78] backdrop-blur">
            <Heart className="size-3 fill-[#6d9a78]" />
            تصوير فني راقي
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-bold leading-tight text-[#2c1810] md:text-7xl">
            {site.hero.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#8c7a74] md:text-xl">
            {site.hero.subheadline}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="#packages"
              className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] bg-[#d48a9e] px-7 text-sm font-bold text-white shadow-[0_8px_30px_rgba(212,138,158,0.3)] transition hover:bg-[#b87084] hover:shadow-[0_8px_35px_rgba(212,138,158,0.4)]"
            >
              اختر باقتك
              <ChevronDown className="size-4" />
            </a>
            <a
              href="#gallery"
              className="inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] border border-[#eaddd4] bg-white/60 px-7 text-sm font-bold text-[#2c1810] transition hover:bg-white hover:shadow-soft"
            >
              <Images className="size-4" />
              شاهد الأعمال
            </a>
          </div>
        </div>
      </section>

      {site.gallery.length ? (
        <section id="gallery" className="bg-white py-16 md:py-24">
          <div className="container-page">
            <div className="text-center">
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#d48a9e]">
                معرض الأعمال
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">لحظات لا تُنسى</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#8c7a74]">
                كل صورة تحكي قصة، وكل قصة تستحق أن تُروى بجمال
              </p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:gap-4 md:px-12">
            {site.gallery.slice(0, 7).map((image, index) => (
              <figure
                key={image.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-[#eaddd4]/50 bg-white shadow-[0_4px_20px_rgba(44,24,16,0.06)] transition-all duration-500 hover:shadow-[0_8px_35px_rgba(212,138,158,0.15)]",
                  index === 0 && "col-span-2 row-span-2",
                  index === 6 && "col-span-2 md:col-span-1"
                )}
              >
                <div className={cn(
                  "relative",
                  index === 0 ? "aspect-[4/5]" : "aspect-[3/4]"
                )}>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(212,138,158,0.12))] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/80 text-[#d48a9e] shadow-lg backdrop-blur">
                      <Heart className="size-5" />
                    </span>
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section id="packages" className="py-16 md:py-24">
        <div className="container-page">
          <div className="text-center">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#6d9a78]">
              باقات التصوير
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">اختاري باقتك المثالية</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#8c7a74]">
              باقات مرنة تناسب كل مناسبة، مع لمسات احترافية لا تُنسى
            </p>
          </div>
        </div>
        <div className="mt-10 grid gap-5 px-4 md:grid-cols-3 md:gap-6 md:px-12">
          {site.packages.map((item, index) => {
            const selected = selectedPackageId === item.id;
            const imageUrl =
              item.imageUrl ?? site.gallery[index % site.gallery.length]?.url ?? site.hero.imageUrl;

            return (
              <article
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border bg-white shadow-[0_4px_25px_rgba(44,24,16,0.06)] transition-all duration-500",
                  selected
                    ? "border-[#d48a9e] shadow-[0_0_40px_rgba(212,138,158,0.2)] -translate-y-1"
                    : "border-[#eaddd4]/60 hover:shadow-[0_8px_35px_rgba(44,24,16,0.1)] hover:-translate-y-0.5"
                )}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={cn(
                      "object-cover transition duration-700",
                      selected ? "scale-105" : "group-hover:scale-105"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
                  {item.isHighlighted ? (
                    <span className="absolute left-3 top-3 inline-flex min-h-7 items-center gap-1 rounded-full border border-[#d48a9e]/30 bg-white/80 px-3 text-xs font-bold text-[#d48a9e] shadow-sm backdrop-blur">
                      <Star className="size-3 fill-[#d48a9e]" />
                      الأكثر طلباً
                    </span>
                  ) : null}
                </div>
                <div className="flex min-h-[320px] flex-col p-6">
                  <h3 className="font-display text-2xl font-bold tracking-wide text-[#2c1810]">
                    {item.name}
                  </h3>
                  {item.subtitle ? (
                    <p className="mt-1 text-sm text-[#8fb89a]">{item.subtitle}</p>
                  ) : null}
                  <p className="mt-4 font-display text-3xl font-bold text-[#d48a9e]">
                    {item.price}
                  </p>
                  <ul className="mt-5 flex-1 space-y-3">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm text-[#8c7a74]">
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
                      "mt-6 min-h-12 rounded-xl text-sm font-bold transition-all duration-300",
                      selected
                        ? "bg-[#d48a9e] text-white shadow-[0_4px_15px_rgba(212,138,158,0.3)]"
                        : "border border-[#eaddd4] bg-white text-[#2c1810] hover:border-[#d48a9e] hover:text-[#d48a9e] hover:shadow-sm"
                    )}
                  >
                    {selected ? "تم الاختيار \u2713" : "اختاري هذه الباقة"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {site.extras.length ? (
        <section id="extras" className="bg-white py-16 md:py-24">
          <div className="container-page">
            <div className="text-center">
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#d48a9e]">
                خدمات إضافية
              </p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">لمسة إضافية</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#8c7a74]">
                اجعل تجربتك أكثر تميزاً مع هذه الإضافات
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {site.extras.map((extra) => {
                const selected = selectedExtraIds.includes(extra.id);
                const Icon = getExtraIcon(extra.iconKey);

                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "group flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center transition-all duration-300",
                      selected
                        ? "border-[#8fb89a] bg-[#f4f8f3] shadow-[0_4px_20px_rgba(143,184,154,0.15)]"
                        : "border-[#eaddd4]/60 bg-white hover:border-[#d48a9e]/40 hover:shadow-[0_4px_20px_rgba(212,138,158,0.08)]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-12 items-center justify-center rounded-full transition-all duration-300",
                        selected
                          ? "bg-[#8fb89a] text-white shadow-[0_4px_12px_rgba(143,184,154,0.3)]"
                          : "bg-[#f5e4ea] text-[#d48a9e] group-hover:bg-[#d48a9e] group-hover:text-white"
                      )}
                    >
                      {selected ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </span>
                    <div>
                      <span className="block font-semibold text-[#2c1810]">{extra.name}</span>
                      <span className="mt-1 block font-display text-lg font-bold text-[#d48a9e]">
                        {extra.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="py-16 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-lg text-center">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#6d9a78]">
              احجز جلستك
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">لنخلق شيئاً جميلاً معاً</h2>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <div className="rounded-3xl border border-[#eaddd4]/60 bg-white/80 p-6 shadow-[0_8px_40px_rgba(44,24,16,0.06)] backdrop-blur md:p-8">
              <h3 className="text-center text-2xl font-bold text-[#2c1810]">ملخص الحجز</h3>
              {selectedPackage ? (
                <div className="mt-6 space-y-4 rounded-2xl bg-[#faf6f2] p-5">
                  <div className="flex items-center justify-between border-b border-[#eaddd4] pb-3">
                    <span className="text-sm text-[#8c7a74]">الباقة</span>
                    <div className="text-left">
                      <strong className="block text-[#2c1810]">{selectedPackage.name}</strong>
                      <span className="text-xs text-[#8fb89a]">{selectedPackage.subtitle}</span>
                    </div>
                  </div>
                  {selectedExtras.length ? (
                    <div className="space-y-2 border-b border-[#eaddd4] pb-3">
                      {selectedExtras.map((extra) => (
                        <div key={extra.id} className="flex justify-between text-sm">
                          <span className="text-[#8c7a74]">{extra.name}</span>
                          <span className="font-semibold text-[#d48a9e]">{extra.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-[#2c1810]">الإجمالي التقريبي</span>
                    <span className="font-display text-2xl font-bold text-[#d48a9e]">
                      {formatTotal(total, selectedPackage.currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-[#faf6f2] p-8">
                  <Heart className="size-8 text-[#eaddd4]" />
                  <p className="text-sm text-[#8c7a74]">اختاري باقة أولاً ليظهر ملخص الحجز.</p>
                </div>
              )}
              <a
                href={bookingHref}
                className={cn(
                  "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300",
                  selectedPackage
                    ? "bg-[#25d366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.3)] hover:bg-[#20b858] hover:shadow-[0_6px_25px_rgba(37,211,102,0.4)]"
                    : "pointer-events-none bg-[#eaddd4] text-white/55"
                )}
              >
                <Phone className="size-4" />
                {site.contact.callToAction}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#eaddd4] bg-[#f4f8f3] py-12 text-center">
        <div className="container-page">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#d48a9e]/40" />
            <span className="font-display text-xs tracking-[0.3em] text-[#8fb89a]">
              FRAMEID
            </span>
            <span className="h-px w-8 bg-[#d48a9e]/40" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-[0.08em] text-[#d48a9e]">
            {site.hero.headline}
          </h2>
          <div className="mt-6 flex items-center justify-center gap-3">
            {site.contact.phone ? (
              <a
                href={`tel:${site.contact.phone}`}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] bg-white text-[#8c7a74] transition hover:border-[#d48a9e] hover:text-[#d48a9e] hover:shadow-[0_4px_15px_rgba(212,138,158,0.15)]"
              >
                <Phone className="size-4" />
              </a>
            ) : null}
            {site.contact.instagram ? (
              <a
                href={normalizeSocialUrl(site.contact.instagram, "instagram")}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] bg-white text-[#8c7a74] transition hover:border-[#d48a9e] hover:text-[#d48a9e] hover:shadow-[0_4px_15px_rgba(212,138,158,0.15)]"
              >
                <Instagram className="size-4" />
              </a>
            ) : null}
            {site.contact.facebook ? (
              <a
                href={normalizeSocialUrl(site.contact.facebook, "facebook")}
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#eaddd4] bg-white text-[#8c7a74] transition hover:border-[#d48a9e] hover:text-[#d48a9e] hover:shadow-[0_4px_15px_rgba(212,138,158,0.15)]"
              >
                <span className="text-xs font-bold">FB</span>
              </a>
            ) : null}
          </div>
          <p className="mt-8 font-display text-xs tracking-[0.2em] text-[#8c7a74]/50">
            &copy; {new Date().getFullYear()} FrameID &mdash; كل الحقوق محفوظة
          </p>
        </div>
      </footer>
    </main>
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
  if (!selectedPackage) {
    return "#packages";
  }

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
    return `mailto:${site.contact.email}?subject=${encodeURIComponent(
      `حجز ${selectedPackage.name}`
    )}&body=${encodeURIComponent(message)}`;
  }

  return `mailto:?subject=${encodeURIComponent(site.hero.headline)}&body=${encodeURIComponent(message)}`;
}

function formatTotal(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value)} ${formatCurrencyLabel(currency)}`;
}

function formatCurrencyLabel(currency: string): string {
  return currency === "EGP" ? "جنيه" : currency;
}

function normalizeSocialUrl(value: string, provider: "instagram" | "facebook") {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return provider === "instagram"
    ? `https://instagram.com/${value.replace(/^@/u, "")}`
    : `https://facebook.com/${value}`;
}
