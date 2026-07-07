"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, LogOut, ExternalLink } from "lucide-react"
import { adminSections, type AdminSection } from "@/modules/admin/navigation"
import { adminLogoutAction } from "@/app/_actions/admin-logout"

function SecondaryPanel({ sections }: { sections: AdminSection[] }) {
  const pathname = usePathname()

  return (
    <div className="dashboard-secondary-panel admin-scrollbar">
      {sections.map((section) => (
        <div key={section.id}>
          <div className="dashboard-secondary-head">
            {section.badge && <span className="eyebrow">{section.badge}</span>}
            <h2>{section.title}</h2>
            {section.description && <p>{section.description}</p>}
          </div>
          <nav className="dashboard-nav-group-links">
            {section.links.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive ? "active" : ""}
                >
                  {link.icon && <link.icon size={18} />}
                  <span>{link.label}</span>
                  {link.badge != null && (
                    <span className="dashboard-nav-badge">{link.badge}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string | null>(() => {
    const found = adminSections.find((section) =>
      section.links.some(
        (link) => pathname === link.href || pathname?.startsWith(link.href + "/")
      )
    )
    return found?.id ?? adminSections[0]?.id ?? null
  })

  const currentSections = adminSections.filter((s) => s.id === activeSection)

  return (
    <aside className="dashboard-sidebar admin-scrollbar">
      <Link href="/admin" className="admin-brand" style={{ textDecoration: "none" }}>
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="url(#brand-grad)" />
          <path
            d="M8 18l4-5.5 4 5.5 4-5.5 4 5.5"
            stroke="#17120a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#f3cf73" />
              <stop offset="1" stopColor="#d4af37" />
            </linearGradient>
          </defs>
        </svg>
        <span>
          <strong>FrameID</strong>
          <small>Admin</small>
        </span>
      </Link>

      <Link href="/admin/search" className="sidebar-search-link">
        <Search size={15} />
        ابحث في لوحة التحكم…
        <kbd>⌘K</kbd>
      </Link>

      <div className="dashboard-section-nav">
        <div className="dashboard-primary-sections admin-scrollbar">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                data-accent={section.accent ?? "gold"}
                className={activeSection === section.id ? "selected" : ""}
                onClick={() => setActiveSection(section.id)}
                title={section.description}
              >
                {Icon ? (
                  <span>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                ) : null}
                <strong>{section.title}</strong>
                {section.shortDescription && (
                  <small>{section.shortDescription}</small>
                )}
              </button>
            )
          })}
        </div>

        {currentSections.length > 0 && (
          <SecondaryPanel sections={currentSections} />
        )}
      </div>

      <div className="dashboard-sidebar-footer">
        <div className="sidebar-footer-row">
          <Link href="/" className="dashboard-home-link">
            <ExternalLink size={17} />
            العودة للموقع
          </Link>
          <form action={adminLogoutAction}>
            <button className="dashboard-logout" style={{ width: "auto", padding: "10px 14px" }}>
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
