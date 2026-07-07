"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import {
  Home,
  FileText,
  Images,
  BriefcaseBusiness,
  WandSparkles,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
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
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/content", label: "المحتوى", icon: FileText },
  { href: "/dashboard/gallery", label: "المعرض", icon: Images },
  { href: "/dashboard/services", label: "الخدمات", icon: BriefcaseBusiness },
  { href: "/dashboard/design", label: "التصميم", icon: WandSparkles },
  { href: "/dashboard/billing", label: "التفعيل", icon: CreditCard },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
]

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname?.startsWith(href)
  }

  return (
    <div className="admin-dark-shell" style={{ display: "flex", flexDirection: "column" }}>
      {/* Simple Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 20px",
          height: 60,
          borderBottom: "1px solid rgba(245, 234, 214, 0.1)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="url(#hdr-brand)" />
            <path d="M8 18l4-5.5 4 5.5 4-5.5 4 5.5" stroke="#17120a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <defs>
              <linearGradient id="hdr-brand" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#f3cf73" />
                <stop offset="1" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          <strong style={{ color: "#fff7e8", fontSize: "1rem" }}>FrameID</strong>
        </Link>

        {/* Desktop nav */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: 2,
          }}
          className="md:flex"
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
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: "0.82rem",
                  fontWeight: 850,
                  textDecoration: "none",
                  color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.65)",
                  background: active ? "rgba(243, 207, 115, 0.1)" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ color: "rgba(245, 234, 214, 0.5)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 900, textDecoration: "none" }}>
            <ExternalLink size={14} />
            <span className="hidden md:inline">الموقع</span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.1)",
                background: "transparent",
                color: "rgba(245, 234, 214, 0.5)",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <LogOut size="15" />
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
            gap: 4,
            width: 200,
            padding: "14px 12px",
            borderInlineEnd: "1px solid rgba(245, 234, 214, 0.1)",
            flexShrink: 0,
          }}
          className="md:flex"
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
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: "0.85rem",
                  fontWeight: active ? 950 : 850,
                  textDecoration: "none",
                  color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.65)",
                  background: active ? "rgba(243, 207, 115, 0.1)" : "transparent",
                  border: active ? "1px solid rgba(243, 207, 115, 0.15)" : "1px solid transparent",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            )
          })}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0, padding: "18px 20px", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "6px 8px",
          borderTop: "1px solid rgba(245, 234, 214, 0.1)",
          background: "rgba(15, 17, 23, 0.96)",
          flexShrink: 0,
        }}
        className="md:hidden"
      >
        {navItems.slice(0, 5).map((item) => {
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
                gap: 2,
                padding: "6px 8px",
                borderRadius: 8,
                fontSize: "0.6rem",
                fontWeight: 900,
                textDecoration: "none",
                color: active ? "#f3cf73" : "rgba(245, 234, 214, 0.5)",
                transition: "color 0.15s",
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
