"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Camera,
  Check,
  Film,
  Images,
  Menu,
  Phone,
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

const EMPTY_BOOKING_MESSAGE = "قم بتحديد باقه من الاعلي لظهر ملخص الحجز هنا اولا";

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

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  function toggleExtra(extraId: string) {
    setSelectedExtraIds((current) =>
      current.includes(extraId) ? current.filter((id) => id !== extraId) : [...current, extraId]
    );
  }

  function handleBookingClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (selectedPackage) return;
    event.preventDefault();
    scrollToSection("packages");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-[#e5c07b] selection:text-black">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#050505]/72 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <button type="button" onClick={() => scrollToSection("home")} className="font-display text-xl font-bold tracking-[0.12em] text-[#e5c07b]">
            {site.hero.headline}
          </button>
          <div className="hidden items-center gap-8 text-sm text-white/68 md:flex">
            <ScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <ScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <ScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <ScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
          </div>
          <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden" aria-label="القائمة" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-white/5 bg-[#050505]/95 px-6 py-3 md:hidden">
            <MobileScrollButton onClick={() => scrollToSection("home")} label="الرئيسية" />
            <MobileScrollButton onClick={() => scrollToSection("packages")} label="الباقات" />
            <MobileScrollButton onClick={() => scrollToSection("extras")} label="الإضافات" />
            <MobileScrollButton onClick={() => scrollToSection("contact")} label="الحجز" />
          </div>
        ) : null}
      </nav>

      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Image src={site.hero.imageUrl} alt={site.hero.headline} fill priority sizes="100vw" className="scale-105 object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.68),rgba(5,5,5,.22)_45%,#050505_100%)]" />
        <div className="container-page relative z-10 pt-24 text-center">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">تصوير احترافي</p>
          <h1 className="mx-auto mt-5 max-w-5xl font-display text-5xl font-bold tracking-[0.12em] text-white md:text-8xl">{site.hero.headline}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/78 md:text-2xl">{site.hero.subheadline}</p>
          <button type="button" onClick={() => scrollToSection("packages")} className="mt-8 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-[linear-gradient(135deg,#f8e5ba,#e5c07b,#c49b50)] px-7 text-sm font-bold text-black">
            اختر باقتك
          </button>
        </div>
      </section>

      {site.gallery.length ? (
        <section className="container-page py-16 md:py-24">
          <SectionHeading eyebrow="أعمال مختارة" title="لمحات من الأعمال" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {site.gallery.slice(0, 8).map((image, index) => (
              <figure key={image.id} className={cn("relative overflow-hidden rounded-2xl border border-white/5 bg-white/5", index === 0 && "sm:col-span-2 sm:row-span-2")}>
                <div className="relative aspect-[4/5]">
                  <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 92vw" className="object-cover" />
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
        <div className="mt-10 grid gap-4 px-4 pb-6 md:flex md:snap-x md:snap-mandatory md:overflow-x-auto md:px-12">
          {site.packages.map((item, index) => {
            const selected = selectedPackageId === item.id;
            const imageUrl = item.imageUrl ?? site.gallery[index % site.gallery.length]?.url ?? site.hero.imageUrl;

            return (
              <article key={item.id} className={cn("relative w-full overflow-hidden rounded-2xl border bg-[#0f0f0f] shadow-[0_20px_80px_rgba(0,0,0,.25)] transition md:w-[340px] md:shrink-0 md:snap-center", selected ? "border-[#e5c07b] shadow-[0_0_35px_rgba(229,192,123,.16)]" : "border-white/5")}>
                <div className="relative h-52">
                  <Image src={imageUrl} alt={item.name} fill sizes="340px" className="object-cover opacity-78" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
                  {item.isHighlighted ? (
                    <span className="absolute left-3 top-3 inline-flex min-h-7 items-center gap-1 rounded-full border border-[#e5c07b]/30 bg-black/45 px-3 text-xs font-bold text-[#e5c07b] backdrop-blur"><Star className="size-3" />مميز</span>
                  ) : null}
                </div>
                <div className="flex min-h-[360px] flex-col p-6">
                  <h3 className="font-display text-2xl font-bold tracking-wider">{item.name}</h3>
                  {item.subtitle ? <p className="mt-1 text-sm text-[#e5c07b]">{item.subtitle}</p> : null}
                  <p className="mt-5 font-display text-3xl font-bold">{item.price}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {item.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-white/68"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#e5c07b]" /><span>{feature}</span></li>)}
                  </ul>
                  <button type="button" onClick={() => setSelectedPackageId(item.id)} className={cn("mt-6 min-h-12 rounded-xl text-sm font-bold transition", selected ? "bg-[linear-gradient(135deg,#f8e5ba,#e5c07b,#c49b50)] text-black" : "bg-white/5 text-white hover:bg-white/10")}>
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
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {site.extras.map((extra) => {
                const selected = selectedExtraIds.includes(extra.id);
                const Icon = getExtraIcon(extra.iconKey);
                return (
                  <button key={extra.id} type="button" onClick={() => toggleExtra(extra.id)} className={cn("flex min-h-20 items-center justify-between rounded-2xl border bg-white/[0.035] p-4 text-start transition", selected ? "border-[#e5c07b] bg-[#e5c07b]/8" : "border-white/5 hover:bg-white/[0.06]")}>
                    <span className="flex items-center gap-3">
                      <span className={cn("inline-flex size-11 items-center justify-center rounded-full border", selected ? "border-[#e5c07b] bg-[#e5c07b] text-black" : "border-white/10 bg-black/35 text-[#e5c07b]")}>{selected ? <Check className="size-4" /> : <Icon className="size-4" />}</span>
                      <span className="font-semibold">{extra.name}</span>
                    </span>
                    <span className="font-display text-lg font-bold text-[#e5c07b]">{extra.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/5 bg-white/[0.035] p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,.22)] md:p-8">
          <h2 className="text-2xl font-bold">ملخص الحجز</h2>
          {selectedPackage ? (
            <div className="mt-6 space-y-4 rounded-2xl bg-[#111] p-5 text-start">
              <div className="flex justify-between border-b border-white/5 pb-3"><span className="text-sm text-white/55">الباقة</span><strong>{selectedPackage.name}</strong></div>
              {selectedExtras.length ? <div className="space-y-2 border-b border-white/5 pb-3">{selectedExtras.map((extra) => <div key={extra.id} className="flex justify-between text-sm"><span className="text-white/65">{extra.name}</span><span className="text-[#e5c07b]">{extra.price}</span></div>)}</div> : null}
              <div className="flex items-center justify-between"><span className="font-bold">الإجمالي التقريبي</span><span className="font-display text-2xl font-bold text-[#e5c07b]">{formatTotal(total, selectedPackage.currency)}</span></div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm font-bold leading-7 text-white/55">{EMPTY_BOOKING_MESSAGE}</p>
          )}
          <a href={bookingHref} onClick={handleBookingClick} className={cn("mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition", selectedPackage ? "bg-[#25d366] text-white hover:bg-[#20b858]" : "bg-white/5 text-white/35")}>
            <Phone className="size-4" />{selectedPackage ? site.contact.callToAction : "اختار باقة أولًا"}
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#020202] py-12 text-center">
        <h2 className="font-display text-3xl font-bold tracking-[0.18em] text-[#e5c07b]">{site.hero.headline}</h2>
        <div className="mt-6 flex items-center justify-center gap-3">
          {site.contact.phone ? <a href={`tel:${site.contact.phone}`} className="inline-flex size-10 items-center justify-center rounded-full bg-white/5 text-white/55 transition hover:bg-[#e5c07b]/15 hover:text-white"><Phone className="size-4" /></a> : null}
          {site.contact.instagram ? <a href={normalizeSocialUrl(site.contact.instagram, "instagram")} className="inline-flex size-10 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/55 transition hover:bg-[#e5c07b]/15 hover:text-white">IG</a> : null}
          {site.contact.facebook ? <a href={normalizeSocialUrl(site.contact.facebook, "facebook")} className="inline-flex size-10 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/55 transition hover:bg-[#e5c07b]/15 hover:text-white">FB</a> : null}
        </div>
        <p className="mt-8 font-display text-xs tracking-[0.2em] text-white/30">© {new Date().getFullYear()} FrameID</p>
      </footer>
    </main>
  );
}

function ScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="hover:text-[#e5c07b]">{label}</button>;
}

function MobileScrollButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="block w-full rounded-lg px-3 py-3 text-center text-sm text-white/75 hover:bg-white/5 hover:text-[#e5c07b]">{label}</button>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="text-center"><p className="font-display text-xs uppercase tracking-[0.28em] text-[#e5c07b]">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold md:text-5xl">{title}</h2></div>;
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

function createBookingHref({ site, selectedPackage, selectedExtras, total }: { site: PublicSiteViewModel; selectedPackage: PublicSiteViewModel["packages"][number] | undefined; selectedExtras: PublicSiteViewModel["extras"]; total: number; }) {
  if (!selectedPackage) return "#packages";
  const message = [`مرحباً، أريد تأكيد الحجز في موقع ${site.hero.headline}.`, "", `الباقة: ${selectedPackage.name} (${selectedPackage.price})`, selectedExtras.length ? `الإضافات: ${selectedExtras.map((item) => `${item.name} (${item.price})`).join("، ")}` : "الإضافات: لا يوجد", `الإجمالي التقريبي: ${formatTotal(total, selectedPackage.currency)}`].join("\n");
  if (site.contact.whatsapp) return `https://wa.me/${site.contact.whatsapp.replace(/[^\d]/gu, "")}?text=${encodeURIComponent(message)}`;
  if (site.contact.email) return `mailto:${site.contact.email}?subject=${encodeURIComponent(`حجز ${selectedPackage.name}`)}&body=${encodeURIComponent(message)}`;
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
