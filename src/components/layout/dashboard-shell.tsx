"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  LayoutDashboard,
  UserCircle,
  Images,
  Package,
  Palette,
  Globe2,
  Settings,
  LogOut,
  ExternalLink,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react"
import { logoutAction } from "@/app/_actions/logout"
import "@/app/admin.css"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/dashboard/site-info", label: "بيانات الموقع", icon: UserCircle },
  { href: "/dashboard/gallery", label: "الأعمال", icon: Images },
  { href: "/dashboard/services", label: "الباقات والخدمات", icon: Package },
  { href: "/dashboard/templates", label: "القوالب", icon: Palette },
  { href: "/dashboard/publish", label: "النشر والمشاركة", icon: Globe2 },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
]

export function DashboardShell({
  children,
  siteSlug,
}: {
  children: ReactNode
  siteSlug?: string
}) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname?.startsWith(href)
  }

  return (
    <div className="admin-dark-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 16px",
          height: 56,
          borderBottom: "1px solid rgba(245, 234, 214, 0.08)",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11, 13, 18, 0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="url(#hdr-brand)" />
            <path d="M8 18l4-5.5 4 5.5 4-5.5 4 5.5" stroke="#17120a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <defs>
              <linearGradient id="hdr-brand" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#f3cf73" />
                <stop offset="1" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          <strong style={{ color: "#fff7e8", fontSize: "0.95rem" }}>FrameID</strong>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: "none", alignItems: "center", gap: 1 }} className="lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  fontWeight: active ? 950 : 850,
                  textDecoration: "none",
                  color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.55)",
                  background: active ? "rgba(243, 207, 115, 0.1)" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {siteSlug && (
            <Link
              href={`/p/${siteSlug}`}
              target="_blank"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: "0.75rem",
                fontWeight: 900,
                textDecoration: "none",
                color: "rgba(245, 234, 214, 0.45)",
                transition: "color 0.15s",
              }}
            >
              <ExternalLink size={13} />
              <span className="hidden md:inline">معاينة</span>
            </Link>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.08)",
                background: "transparent",
                color: "rgba(245, 234, 214, 0.4)",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              aria-label="تسجيل الخروج"
            >
              <LogOut size="14" />
            </button>
          </form>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Desktop Sidebar */}
        <aside
          style={{
            display: "none",
            flexDirection: "column",
            gap: 2,
            width: 220,
            padding: "12px 10px",
            borderInlineEnd: "1px solid rgba(245, 234, 214, 0.06)",
            flexShrink: 0,
            overflowY: "auto",
          }}
          className="lg:flex"
        >
          <div style={{ fontSize: "0.65rem", fontWeight: 950, color: "rgba(245, 234, 214, 0.3)", padding: "8px 10px 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            بناء موقعك
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  fontSize: "0.83rem",
                  fontWeight: active ? 950 : 850,
                  textDecoration: "none",
                  color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.6)",
                  background: active ? "rgba(243, 207, 115, 0.1)" : "transparent",
                  border: active ? "1px solid rgba(243, 207, 115, 0.12)" : "1px solid transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={16} />
                {item.label}
                {active && (
                  <ChevronLeft size={12} style={{ marginRight: "auto", color: "rgba(243, 207, 115, 0.4)" }} />
                )}
              </Link>
            )
          })}
        </aside>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "14px 16px",
            overflowY: "auto",
            paddingBottom: 80,
          }}
          className="lg:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 2,
          padding: "4px 6px",
          borderTop: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(11, 13, 18, 0.96)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingBottom: "env(safe-area-inset-bottom, 4px)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
        className="lg:hidden"
      >
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                padding: "6px 8px",
                borderRadius: 8,
                fontSize: "0.55rem",
                fontWeight: active ? 950 : 850,
                textDecoration: "none",
                color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.45)",
                transition: "color 0.15s",
                minWidth: 76,
              }}
            >
              <Icon size={18} />
              <span style={{ lineHeight: 1.2 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
