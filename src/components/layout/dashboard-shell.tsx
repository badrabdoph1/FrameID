"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  CreditCard,
  ExternalLink,
  Globe2,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Settings,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";

import { logoutAction } from "@/app/_actions/logout";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, toWhatsappHref } from "@/modules/support/support-utils";
import "@/app/admin.css";
import "@/app/customer-dashboard.css";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  priority: "primary" | "secondary";
};

type SupportSettingsResponse = {
  phone?: string;
  whatsappHref?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", shortLabel: "الرئيسية", description: "الرابط، التفعيل، وخطة اليوم.", icon: LayoutDashboard, priority: "primary" },
  { href: "/dashboard/services", label: "الباقات", shortLabel: "الباقات", description: "أول خطوة: أسعارك وعروضك.", icon: Package, priority: "primary" },
  { href: "/dashboard/site-info", label: "التواصل", shortLabel: "التواصل", description: "اسم المصور، واتساب، وروابطك.", icon: UserCircle, priority: "primary" },
  { href: "/dashboard/gallery", label: "الصور", shortLabel: "الصور", description: "الصورة الشخصية، الغلاف، والألبومات.", icon: Images, priority: "primary" },
  { href: "/dashboard/publish", label: "النشر", shortLabel: "النشر", description: "انسخ الرابط وانشر الموقع.", icon: Globe2, priority: "primary" },
  { href: "/dashboard/templates", label: "شكل الموقع", shortLabel: "الشكل", description: "اختيار القالب والهوية البصرية.", icon: Palette, priority: "secondary" },
  { href: "/dashboard/billing", label: "الفواتير والاشتراك", shortLabel: "التفعيل", description: "التجربة المجانية، الاشتراك، وإثبات الدفع.", icon: CreditCard, priority: "secondary" },
  { href: "/dashboard/settings", label: "الإعدادات", shortLabel: "إعدادات", description: "إعدادات الحساب والموقع.", icon: Settings, priority: "secondary" },
];

function isActivePath(pathname: string | null, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname?.startsWith(href) ?? false;
}

function normalizeSupportResponse(input: SupportSettingsResponse | null) {
  const phone = input?.phone || DEFAULT_SUPPORT_WHATSAPP_NUMBER;
  return {
    phone,
    whatsappHref: input?.whatsappHref || toWhatsappHref(phone),
  };
}

function NavLink({ item, active, compact = false, onClick }: { item: NavItem; active: boolean; compact?: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <div className="relative">
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 rounded-2xl border no-underline transition duration-200",
          compact ? "customer-desktop-secondary-link min-h-12 px-3 py-2.5" : "customer-desktop-nav-link min-h-[4.25rem] px-3.5 py-3",
          active
            ? "border-amber-300/28 bg-amber-300/13 text-[#f3cf73] shadow-[0_12px_38px_rgba(243,207,115,0.08)]"
            : "border-white/8 bg-white/[0.035] text-white/65 hover:border-amber-300/22 hover:bg-amber-300/8 hover:text-white",
        )}
      >
        <span className={cn("grid shrink-0 place-items-center rounded-xl transition", compact ? "size-9" : "size-10", active ? "bg-amber-300/16 text-[#f3cf73]" : "bg-white/[0.045]")}> 
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm font-black">{item.label}</strong>
          {!compact ? <small className="mt-0.5 block truncate text-[0.7rem] font-bold text-white/38">{item.description}</small> : null}
        </span>
        <ChevronLeft className="size-4 text-white/25 transition group-hover:text-[#f3cf73]" aria-hidden />
      </Link>
    </div>
  );
}

function DashboardTitleBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className="pointer-events-none flex min-w-0 justify-center">
      <div className={cn(
        "relative min-w-0 overflow-hidden rounded-full border border-amber-300/24 bg-[linear-gradient(135deg,rgba(243,207,115,0.18),rgba(255,255,255,0.055))] text-center shadow-[0_14px_42px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
        compact ? "px-2.5 py-1.5 sm:px-3" : "customer-desktop-title-badge px-4 py-2 md:px-7 md:py-2.5"
      )}>
        <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-amber-200/70 to-transparent" aria-hidden />
        <h1 className={cn(
          "truncate whitespace-nowrap bg-gradient-to-l from-[#fff7e8] via-[#f3cf73] to-[#fff7e8] bg-clip-text font-black tracking-tight text-transparent drop-shadow-[0_0_18px_rgba(243,207,115,0.22)]",
          compact ? "text-[0.68rem] xs:text-[0.72rem] sm:text-sm" : "text-sm md:text-2xl"
        )}>
          صفحة التحكم في موقعك
        </h1>
      </div>
    </div>
  );
}

function IdentityBrand({ large = false, photographerName }: { large?: boolean; photographerName?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-2 rounded-2xl no-underline", large ? "p-2" : "p-1")}> 
      <BrandMark large={large} />
      <span className="min-w-0">
        <strong className={cn("block truncate font-black text-[#fff7e8]", large ? "text-base" : "text-xs sm:text-sm")}>{photographerName || "FrameID"}</strong>
        <small className={cn("block truncate font-bold text-white/42", large ? "text-xs" : "text-[0.6rem] sm:text-[0.68rem]")}>لوحة المصور</small>
      </span>
    </Link>
  );
}

function CustomerSupportLink({ href, compact = false }: { href: string; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-2.5 text-[0.68rem] font-black text-emerald-200 no-underline transition hover:bg-emerald-400/16 hover:text-white sm:px-3 sm:text-xs"
        aria-label="الدعم الفني"
      >
        <MessageCircle className="size-3.5 shrink-0" aria-hidden />
        <span>الدعم</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-2xl border border-emerald-300/22 bg-emerald-400/10 px-4 text-sm font-black text-emerald-200 no-underline transition hover:bg-emerald-400/16 hover:text-white lg:min-h-12 lg:px-5"
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden />
      الدعم
    </Link>
  );
}

function CustomerIdentityBar({ supportHref }: { supportHref: string }) {
  return (
    <div className="customer-desktop-identity-bar hidden w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:grid">
      <div className="justify-self-start">
        <IdentityBrand large photographerName={photographerName} />
      </div>
      <DashboardTitleBadge />
      <div className="flex justify-end gap-3 justify-self-end">
        <CustomerSupportLink href={supportHref} />
      </div>
    </div>
  );
}

export function DashboardShell({ children, siteSlug, hasSubscription, photographerName }: { children: ReactNode; siteSlug?: string; hasSubscription?: boolean; photographerName?: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportSettings, setSupportSettings] = useState(() => normalizeSupportResponse(null));
  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/billing" && !hasSubscription) return false;
    return true;
  });
  const primaryNav = visibleNavItems.filter((item) => item.priority === "primary").slice(0, 4);
  const secondaryNav = visibleNavItems.filter((item) => item.priority === "secondary");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/support-settings", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<SupportSettingsResponse> : null)
      .then((data) => setSupportSettings(normalizeSupportResponse(data)))
      .catch(() => setSupportSettings(normalizeSupportResponse(null)));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="customer-desktop-shell min-h-dvh bg-[#0b0d12] text-[#f5ead6] color-scheme-dark" style={{ background: "#0b0d12", color: "#f5ead6" }}>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090b10]/92 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(4.45rem,1fr)_auto_minmax(6.2rem,1fr)] items-center gap-1.5 sm:grid-cols-[minmax(5.5rem,1fr)_auto_minmax(7.5rem,1fr)] sm:gap-2">
          <IdentityBrand />

          <DashboardTitleBadge compact />

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <CustomerSupportLink href={supportSettings.whatsappHref} compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="فتح كل أقسام لوحة العميل"
              aria-controls="dashboard-mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="customer-desktop-layout mx-auto flex min-h-dvh max-w-[1440px] lg:min-h-screen">
        <aside className="customer-desktop-sidebar sticky top-0 hidden w-[296px] shrink-0 flex-col overflow-hidden border-l border-white/8 bg-[#0c0e13] p-4 lg:flex">
          <Link href="/dashboard" className="customer-desktop-brand-card flex shrink-0 items-center gap-3 rounded-3xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8">
            <BrandMark large />
            <span>
              <strong className="block text-lg font-black text-[#fff7e8]">FrameID</strong>
              <small className="block text-xs font-bold text-white/46">رحلة تجهيز موقعك</small>
            </span>
          </Link>

          <nav className="customer-desktop-sidebar-nav mt-4 flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pb-4 pr-0.5 admin-scrollbar">
            <p className="shrink-0 px-2 text-[0.68rem] font-black uppercase tracking-wider text-white/28">خطوات العمل</p>
            {primaryNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
            ))}

            <p className="mt-3 shrink-0 px-2 text-[0.68rem] font-black uppercase tracking-wider text-white/28">أدوات إضافية</p>
            {secondaryNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} compact />
            ))}
          </nav>

          <div className="mt-auto shrink-0 grid gap-2 border-t border-white/8 pt-3">
            {siteSlug ? (
              <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/10 px-3 text-sm font-black text-[#f3cf73] no-underline transition hover:bg-amber-300/16 hover:text-[#ffe9a8]">
                <ExternalLink className="size-4" aria-hidden />
                فتح الموقع
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/50 transition hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-100">
                <LogOut className="size-4" aria-hidden />
                خروج
              </button>
            </form>
          </div>
        </aside>

        <main className="customer-desktop-main min-w-0 flex-1 overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.08),transparent_30%),#090b10] px-3 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-4 lg:px-7 lg:py-7 lg:pb-8 xl:px-9">
          <div className="mx-auto hidden w-full max-w-6xl lg:block">
            <CustomerIdentityBar supportHref={supportSettings.whatsappHref} />
          </div>
          <div className="mx-auto w-full max-w-[1120px] lg:mt-5" style={{ width: "min(100%, 1120px)", marginInline: "auto" }}>{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090b10]/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 backdrop-blur-xl lg:hidden" aria-label="تنقل لوحة العميل للموبايل">
        <div className="relative grid grid-cols-5 gap-1">
          {primaryNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "grid min-h-[3.25rem] place-items-center gap-0.5 rounded-2xl px-1 text-center no-underline transition",
                  active ? "bg-amber-300/12 text-[#f3cf73]" : "text-white/45 hover:bg-white/[0.05] hover:text-white/70",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate text-[0.62rem] font-black leading-tight">{item.shortLabel}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="فتح باقي أقسام لوحة العميل" aria-expanded={mobileMenuOpen} aria-controls="dashboard-mobile-menu" className="grid min-h-[3.25rem] place-items-center gap-0.5 rounded-2xl px-1 text-center text-white/45 transition hover:bg-white/[0.05] hover:text-white/70"><Menu className="size-5" aria-hidden /><span className="text-[0.62rem] font-black leading-tight">المزيد</span></button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div id="dashboard-mobile-menu" className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="كل أقسام لوحة العميل">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileMenuOpen(false)}
          />
          <section className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-h-[74dvh] overflow-y-auto overscroll-contain rounded-[1.6rem] border border-white/12 bg-[#10131a] p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-black text-[#f3cf73]">كل الأدوات</p>
                <h2 className="mt-1 text-lg font-black text-[#fff7e8]">عايز تعمل إيه؟</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-white/42">اختار القسم حسب المهمة، مش حسب الإعدادات التقنية.</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70"
                aria-label="إغلاق"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="grid gap-2">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function BrandMark({ large = false }: { large?: boolean }) {
  const size = large ? 36 : 30;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="url(#customer-dashboard-brand)" />
      <path d="M8 18l4-5.5 4 5.5 4-5.5 4 5.5" stroke="#17120a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="customer-dashboard-brand" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#f3cf73" />
          <stop offset="1" stopColor="#d4af37" />
        </linearGradient>
      </defs>
    </svg>
  );
}
