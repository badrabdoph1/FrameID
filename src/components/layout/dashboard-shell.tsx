"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  LayoutDashboard,
  UserCircle,
  Images,
  Package,
  Palette,
  Globe2,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  ChevronLeft,
  Menu,
  X,
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
  { href: "/dashboard/gallery", label: "معرض الأعمال", icon: Images },
  { href: "/dashboard/services", label: "الباقات والأسعار", icon: Package },
  { href: "/dashboard/templates", label: "تغيير القالب", icon: Palette },
  { href: "/dashboard/publish", label: "نشر ومشاركة", icon: Globe2 },
  { href: "/dashboard/billing", label: "الفواتير والاشتراك", icon: CreditCard },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobilePrimaryNav = [
    navItems[0],
    navItems[1],
    navItems[2],
    navItems[5],
  ].filter(Boolean) as NavItem[]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname?.startsWith(href)
  }

  return (
    <div
      className="admin-dark-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#0b0d12",
        color: "#f5ead6",
      }}
    >
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
              <span className="hidden md:inline">شوف الموقع</span>
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
              aria-label="خروج"
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
            أقسام الموقع
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
            background:
              "radial-gradient(circle at top right, rgba(243,207,115,0.08), transparent 32%), #0b0d12",
          }}
          className="lg:pb-6"
        >
          <div style={{ width: "min(100%, 1120px)", marginInline: "auto" }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="تنقل لوحة العميل للموبايل"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
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
        }}
        className="lg:hidden"
      >
        {mobilePrimaryNav.map((item) => {
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
                fontSize: "0.58rem",
                fontWeight: active ? 950 : 850,
                textDecoration: "none",
                color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.45)",
                background: active ? "rgba(243, 207, 115, 0.1)" : "transparent",
                transition: "color 0.15s",
                minWidth: 0,
              }}
            >
              <Icon size={18} />
              <span style={{ lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          aria-label="فتح باقي أقسام لوحة العميل"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            padding: "6px 8px",
            borderRadius: 8,
            border: 0,
            background: mobileMenuOpen ? "rgba(243, 207, 115, 0.12)" : "transparent",
            color: mobileMenuOpen ? "#f3cf73" : "rgba(245, 234, 214, 0.45)",
            fontSize: "0.58rem",
            fontWeight: 900,
            fontFamily: "inherit",
          }}
        >
          <Menu size={18} />
          <span>المزيد</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="إغلاق قائمة لوحة العميل"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 48,
              border: 0,
              background: "rgba(0,0,0,0.48)",
            }}
          />
          <section
            role="dialog"
            aria-label="كل أقسام لوحة العميل"
            className="lg:hidden"
            style={{
              position: "fixed",
              right: 10,
              left: 10,
              bottom: "calc(74px + env(safe-area-inset-bottom))",
              zIndex: 49,
              maxHeight: "68dvh",
              overflowY: "auto",
              borderRadius: 18,
              border: "1px solid rgba(245, 234, 214, 0.13)",
              background: "rgba(15, 18, 25, 0.98)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, color: "#f3cf73", fontSize: "0.7rem", fontWeight: 950 }}>كل الأقسام</p>
                <h2 style={{ margin: "2px 0 0", color: "#fff7e8", fontSize: "1rem", fontWeight: 950 }}>اختار الخطوة اللي محتاجها</h2>
              </div>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(245, 234, 214, 0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(245, 234, 214, 0.65)",
                }}
              >
                <X size={17} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {navItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minHeight: 48,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: active ? "1px solid rgba(243, 207, 115, 0.3)" : "1px solid rgba(245, 234, 214, 0.08)",
                      background: active ? "rgba(243, 207, 115, 0.12)" : "rgba(255,255,255,0.035)",
                      color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.76)",
                      textDecoration: "none",
                      fontSize: "0.88rem",
                      fontWeight: 900,
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    <ChevronLeft size={14} style={{ marginRight: "auto", opacity: 0.5 }} />
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
