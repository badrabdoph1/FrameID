"use client"

import { Search, Bell, Plus, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useCallback } from "react"

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let href = ""
  for (const seg of segments) {
    href += "/" + seg
    const label = seg
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    crumbs.push({ label, href })
  }
  return crumbs
}

export function AdminTopbar() {
  const pathname = usePathname()
  const crumbs = useBreadcrumbs(pathname)
  const [searchOpen, setSearchOpen] = useState(false)

  const getPageTitle = useCallback(() => {
    if (crumbs.length <= 1) return ""
    return crumbs[crumbs.length - 1]?.label ?? ""
  }, [crumbs])

  return (
    <header className="dashboard-topbar">
      <div>
        <nav className="admin-breadcrumb">
          <Link href="/admin">لوحة التحكم</Link>
          {crumbs.length > 1 && (
            <>
              {crumbs.slice(1, -1).map((crumb) => (
                <span key={crumb.href}>
                  <ChevronLeft size={12} />
                  <Link href={crumb.href}>{crumb.label}</Link>
                </span>
              ))}
              <span>
                <ChevronLeft size={12} />
                <Link href={crumbs[crumbs.length - 1].href}>
                  {crumbs[crumbs.length - 1].label}
                </Link>
              </span>
            </>
          )}
        </nav>
        <h1>{getPageTitle() || "لوحة التحكم"}</h1>
      </div>

      <div className="dashboard-topbar-actions">
        {searchOpen ? (
          <div className="dashboard-global-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث في لوحة التحكم…"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
            <button>⌘K</button>
          </div>
        ) : (
          <button
            className="admin-icon-button"
            onClick={() => setSearchOpen(true)}
            aria-label="بحث"
          >
            <Search size={18} />
          </button>
        )}

        <Link href="/admin/notifications" className="admin-icon-button" aria-label="الإشعارات">
          <Bell size={18} />
          <span className="topbar-badge dashboard-nav-badge" style={{ fontSize: "0.62rem" }}>
            3
          </span>
        </Link>

        <Link href="/admin/new" className="btn-gold" style={{ minHeight: 42 }}>
          <Plus size={18} />
          إنشاء جديد
        </Link>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(245, 234, 214, 0.2)",
            background: "linear-gradient(135deg, rgba(243,207,115,0.2), rgba(243,207,115,0.08))",
            display: "grid",
            placeItems: "center",
            color: "#f3cf73",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          A
        </div>
      </div>
    </header>
  )
}
