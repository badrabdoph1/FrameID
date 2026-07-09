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
  Package,
  Palette,
  Settings,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/_actions/logout";
import { cn } from "@/lib/utils/cn";
import "@/app/admin.css";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  priority: "primary" | "secondary";
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    shortLabel: "الرئيسية",
    description: "الرابط، التفعيل، وخطة اليوم.",
    icon: LayoutDashboard,
    priority: "primary",
  },
  {
    href: "/dashboard/services",
    label: "الباقات",
    shortLabel: "الباقات",
    description: "أول خطوة: أسعارك وعروضك.",
    icon: Package,
    priority: "primary",
  },
  {
    href: "/dashboard/site-info",
    label: "التواصل",
    shortLabel: "التواصل",
    description: "اسم المصور، واتساب، وروابطك.",
    icon: UserCircle,
    priority: "primary",
  },
  {
    href: "/dashboard/gallery",
    label: "الصور",
    shortLabel: "الصور",
    description: "الصورة الشخصية، الغلاف، والألبومات.",
    icon: Images,
    priority: "primary",
  },
  {
    href: "/dashboard/publish",
    label: "النشر",
    shortLabel: "النشر",
    description: "انسخ الرابط وانشر الموقع.",
    icon: Globe2,
    priority: "primary",
  },
  {
    href: "/dashboard/templates",
    label: "شكل الموقع",
    shortLabel: "الشكل",
    description: "اختيار القالب والهوية البصرية.",
    icon: Palette,
    priority: "secondary",
  },
  {
    href: "/dashboard/billing",
    label: "التفعيل والدفع",
    shortLabel: "التفعيل",
    description: "التجربة المجانية، الاشتراك، وإثبات الدفع.",
    icon: CreditCard,
    priority: "secondary",
  },
  {
    href: "/dashboard/settings",
    label: "الإعدادات",
    shortLabel: "إعدادات",
    description: "إعدادات الحساب والموقع.",
    icon: Settings,
    priority: "secondary",
  },
];

function isActivePath(pathname: string | null, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname?.startsWith(href) ?? false;
}

function NavLink({ item, active, compact = false, onClick }: { item: NavItem; active: boolean; compact?: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border no-underline transition",
        compact ? "min-h-12 px-3 py-2.5" : "min-h-[4.25rem] px-3.5 py-3",
        active
          ? "border-amber-300/25 bg-amber-300/12 text-[#f3cf73]"
          : "border-white/8 bg-white/[0.035] text-white/65 hover:border-amber-300/18 hover:bg-amber-300/8 hover:text-white",
      )}
    >
      <span className={cn("grid shrink-0 place-items-center rounded-xl", compact ? "size-9" : "size-10", active ? "bg-amber-300/14" : "bg-white/[0.045]")}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm font-black">{item.label}</strong>
        {!compact ? <small className="mt-0.5 block truncate text-[0.7rem] font-bold text-white/38">{item.description}</small> : null}
      </span>
      <ChevronLeft className="size-4 text-white/25 transition group-hover:text-[#f3cf73]" aria-hidden />
    </Link>
  );
}

export function DashboardShell({ children, siteSlug }: { children: ReactNode; siteSlug?: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const primaryNav = navItems.filter((item) => item.priority === "primary").slice(0, 5);
  const secondaryNav = navItems.filter((item) => item.priority === "secondary");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-dvh bg-[#090b10] text-[#f5ead6] color-scheme-dark">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#090b10]/92 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 rounded-2xl p-1.5 no-underline">
            <BrandMark />
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black text-[#fff7e8]">FrameID</strong>
              <small className="block truncate text-[0.68rem] font-bold text-white/40">لوحة المصور</small>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            {siteSlug ? (
              <Link
                href={`/p/${siteSlug}`}
                target="_blank"
                className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="فتح الموقع"
              >
                <ExternalLink className="size-4" aria-hidden />
              </Link>
            ) : null}
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

      <div className="mx-auto flex min-h-dvh max-w-[1440px] lg:min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[296px] shrink-0 flex-col border-l border-white/8 bg-[#0c0e13] p-4 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-3xl border border-white/8 bg-white/[0.035] p-3 no-underline">
            <BrandMark large />
            <span>
              <strong className="block text-base font-black text-[#fff7e8]">FrameID</strong>
              <small className="block text-xs font-bold text-white/40">رحلة تجهيز موقعك</small>
            </span>
          </Link>

          <div className="mt-4 grid gap-2 overflow-y-auto pb-4 pr-0.5 admin-scrollbar">
            <p className="px-2 text-[0.68rem] font-black uppercase tracking-wider text-white/28">خطوات العمل</p>
            {primaryNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
            ))}

            <p className="mt-3 px-2 text-[0.68rem] font-black uppercase tracking-wider text-white/28">أدوات إضافية</p>
            {secondaryNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} compact />
            ))}
          </div>

          <div className="mt-auto grid gap-2 border-t border-white/8 pt-3">
            {siteSlug ? (
              <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white/70 no-underline transition hover:bg-white/[0.08] hover:text-white">
                <ExternalLink className="size-4" aria-hidden />
                فتح الموقع
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/50 transition hover:bg-white/[0.08] hover:text-white">
                <LogOut className="size-4" aria-hidden />
                خروج
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.08),transparent_30%),#090b10] px-3 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-4 lg:px-6 lg:py-6 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090b10]/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 backdrop-blur-xl lg:hidden" aria-label="تنقل لوحة العميل للموبايل">
        <div className="grid grid-cols-5 gap-1">
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
              {navItems.map((item) => (
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
