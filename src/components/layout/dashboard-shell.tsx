import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  Home,
  Images,
  Settings,
  WandSparkles
} from "lucide-react";

const dashboardNav = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText },
  { href: "/dashboard/gallery", label: "المعرض", icon: Images },
  { href: "/dashboard/services", label: "الخدمات", icon: BriefcaseBusiness },
  { href: "/dashboard/design", label: "التصميم", icon: WandSparkles },
  { href: "/dashboard/billing", label: "التفعيل", icon: CreditCard },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl font-semibold">
            FrameID
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface"
            aria-label="الإشعارات"
          >
            <Bell className="size-4" aria-hidden />
          </button>
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
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
