"use client"

import { useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Search, X, Menu, ExternalLink, LogOut } from "lucide-react"
import { useAdmin } from "@/components/layout/admin-context"
import { adminSections } from "@/modules/admin/navigation"

export function AdminMobileNav() {
  const pathname = usePathname()
  const { mobileMenuOpen, toggleMobileMenu } = useAdmin()
  const detailsRefs = useRef<Map<string, HTMLDetailsElement>>(new Map())

  const setDetailsRef = useCallback((id: string, el: HTMLDetailsElement | null) => {
    if (el) detailsRefs.current.set(id, el)
    else detailsRefs.current.delete(id)
  }, [])

  const topLevelLinks = adminSections.map((s) => ({
    href: s.links[0]?.href ?? "/admin",
    label: s.title,
    Icon: s.icon,
  }))

  return (
    <div className="admin-mobile-nav-shell">
      <nav className="admin-mobile-bottom-nav">
        {topLevelLinks.slice(0, 4).map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? "active" : ""}
            >
              <span className="admin-mobile-nav-icon">
                <link.Icon size={20} />
              </span>
              <small>{link.label}</small>
            </Link>
          )
        })}

        <button
          onClick={toggleMobileMenu}
          className={mobileMenuOpen ? "active" : ""}
        >
          <span className="admin-mobile-nav-icon">
            <Menu size={20} />
          </span>
          <small>القائمة</small>
        </button>
      </nav>

      <div
        className={`admin-mobile-menu-backdrop ${mobileMenuOpen ? "open" : ""}`}
        onClick={toggleMobileMenu}
      />

      <div className={`admin-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-mobile-menu-head">
          <div>
            <span className="eyebrow">القائمة الرئيسية</span>
            <h2>لوحة تحكم FrameID</h2>
          </div>
          <button
            className="admin-icon-button"
            onClick={toggleMobileMenu}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="admin-mobile-search">
          <Search size={16} />
          <input type="text" placeholder="ابحث في لوحة التحكم…" />
          <button>بحث</button>
        </div>

        <div className="admin-mobile-section-list">
          {adminSections.map((section) => {
            const Icon = section.icon

            return (
              <details
                key={section.id}
                ref={(el) => setDetailsRef(section.id, el)}
              >
                <summary data-accent={section.accent ?? "gold"}>
                  {Icon ? (
                    <span>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                  ) : (
                    <span>
                      <LayoutDashboard size={16} aria-hidden="true" />
                    </span>
                  )}
                  <div style={{ display: "grid", gap: 1 }}>
                    <strong>{section.title}</strong>
                    {section.shortDescription && (
                      <small>{section.shortDescription}</small>
                    )}
                  </div>
                </summary>
                <div>
                  {section.links.map((link) => {
                    const isActive =
                      pathname === link.href || pathname?.startsWith(link.href + "/")
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={isActive ? "active" : ""}
                        onClick={toggleMobileMenu}
                      >
                        {link.icon && <link.icon size={17} />}
                        <span>{link.label}</span>
                        {link.badge != null && (
                          <span className="dashboard-nav-badge">{link.badge}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>

        <div className="admin-mobile-menu-actions">
          <Link href="/" className="dashboard-home-link" onClick={toggleMobileMenu}>
            <ExternalLink size={17} />
            العودة للموقع
          </Link>
          <button className="dashboard-logout" onClick={toggleMobileMenu}>
            <LogOut size={17} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}
