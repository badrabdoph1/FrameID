import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Home,
  Images,
  LogOut,
  Settings,
  WandSparkles
} from "lucide-react";

import { logoutAction } from "@/app/_actions/logout";

const dashboardNav = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText },
  { href: "/dashboard/gallery", label: "المعرض", icon: Images },
  { href: "/dashboard/services", label: "الخدمات", icon: BriefcaseBusiness },
  { href: "/dashboard/design", label: "التصميم", icon: WandSparkles },
  { href: "/dashboard/billing", label: "الفواتير", icon: CreditCard },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

export function PhotographerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="font-display text-xl font-semibold">
            FrameID
          </Link>
          <form action={logoutAction} className="md:hidden">
            <button
              type="submit"
              aria-label="خروج"
              className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <div className="container-page grid gap-6 pb-24 md:grid-cols-[220px_1fr] md:pb-10 md:pt-6">
        <nav
          aria-label="لوحة المصور"
          className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-7 rounded-[var(--radius-panel)] border border-border bg-surface/94 p-1 shadow-soft backdrop-blur-xl md:sticky md:top-24 md:block md:h-fit md:space-y-1 md:bg-transparent md:p-0 md:shadow-none"
        >
          {dashboardNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] px-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:min-h-11 md:flex-row md:justify-start md:px-3 md:text-sm"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
          <div className="hidden md:block">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
