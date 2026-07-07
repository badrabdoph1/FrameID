"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CreditCard,
  DatabaseBackup,
  FileText,
  Headphones,
  Home,
  Image,
  Layout,
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  Users,
  Bell,
  BarChart3,
  Flag,
  Search,
  ChevronDown,
  Menu,
  X,
  Globe,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/app/_actions/logout";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "التشغيل",
    items: [
      { href: "/admin", label: "القيادة", icon: Home },
      { href: "/admin/customers", label: "العملاء", icon: Users },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
      { href: "/admin/subscriptions", label: "الاشتراكات", icon: BadgeCheck },
      { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { href: "/admin/content", label: "المحتوى", icon: FileText },
      { href: "/admin/media", label: "الوسائط", icon: Image },
      { href: "/admin/templates", label: "القوالب", icon: Layout },
      { href: "/admin/themes", label: "السمات", icon: Palette },
    ],
  },
  {
    label: "المنصة",
    items: [
      { href: "/admin/backups", label: "النسخ الاحتياطي", icon: DatabaseBackup },
      { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
      { href: "/admin/feature-flags", label: "الميزات", icon: Flag },
      { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
      { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
      { href: "/admin/audit", label: "السجل", icon: ClipboardList },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-[var(--radius-control)] bg-champagne text-xs font-bold text-ink">
            F
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-semibold text-white">
              FrameID
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden size-7 items-center justify-center rounded-[var(--radius-control)] text-white/40 transition hover:bg-white/10 hover:text-white lg:flex"
        >
          <ChevronDown className={cn("size-4 transition", collapsed && "rotate-180")} />
        </button>
      </div>

      <div className="px-3 py-3">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className="flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-white/[0.04] px-3 text-sm text-white/40 transition hover:bg-white/10 hover:text-white/70"
        >
          <Search className="size-4" />
          {!collapsed && <span>⌘K بحث سريع...</span>}
        </Link>
      </div>

      <nav aria-label="لوحة الإدارة" className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-medium text-white/30">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex h-9 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm transition",
                    isActive(item.href)
                      ? "bg-champagne/10 text-champagne font-medium"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="mr-auto rounded-full bg-champagne/20 px-2 py-0.5 text-xs text-champagne">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex h-9 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed right-4 top-3 z-40 flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-[#0f0f0f] border border-white/10 text-white lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full flex-col border-l border-white/10 bg-[#070707] transition-all duration-300 lg:static lg:z-auto",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-[var(--radius-control)] text-white/50 hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
