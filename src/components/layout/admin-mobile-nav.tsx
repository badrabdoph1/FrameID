"use client"

import { useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, X, ExternalLink, LogOut, ChevronDown, Menu } from "lucide-react"
import { useAdmin } from "@/components/layout/admin-context"
import { adminSections } from "@/modules/admin/navigation"
import { cn } from "@/lib/utils/cn"

function isAdminLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isSectionActive(pathname: string | null, sectionId: string): boolean {
  const section = adminSections.find((item) => item.id === sectionId)
  if (!section) return false
  return section.links.some((link) => isAdminLinkActive(pathname, link.href))
}

export function AdminMobileNav() {
  const pathname = usePathname()
  const { mobileMenuOpen, toggleMobileMenu } = useAdmin()
  const detailsRefs = useRef<Map<string, HTMLDetailsElement>>(new Map())
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const setDetailsRef = useCallback((id: string, el: HTMLDetailsElement | null) => {
    if (el) detailsRefs.current.set(id, el)
    else detailsRefs.current.delete(id)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    for (const section of adminSections) {
      const details = detailsRefs.current.get(section.id)
      if (details) details.open = isSectionActive(pathname, section.id)
    }
  }, [mobileMenuOpen, pathname])

  const topLevelSections = adminSections.slice(0, 4)
  const overflowSections = adminSections.slice(4)
  const overflowActive = overflowSections.some((section) => isSectionActive(pathname, section.id))
  const topLevelLinks = topLevelSections.map((s) => ({
    href: s.links[0]?.href ?? "/admin",
    label: s.title,
    Icon: s.icon,
    accent: s.accent,
    sectionId: s.id,
  }))

  return (
    <>
      {/* Bottom Navigation */}
      <div className="admin-mobile-nav-shell">
        <nav
          aria-label="تنقل الأدمن للموبايل"
          className="grid grid-cols-5 items-center gap-1 rounded-2xl border border-white/10 bg-[#141825]/98 px-2 py-1.5 shadow-2xl backdrop-blur-lg"
        >
          {topLevelLinks.map((link) => {
            const isActive = isSectionActive(pathname, link.sectionId)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[0.6rem] font-extrabold text-white/60 no-underline transition min-w-0",
                  isActive && "bg-gradient-to-br from-amber-500 to-amber-300 text-[#111827]",
                )}
              >
                <link.Icon size={20} />
                <span className="truncate max-w-full leading-tight">{link.label}</span>
              </Link>
            )
          })}

          <button
            onClick={toggleMobileMenu}
            aria-label="فتح كل أقسام الأدمن"
            aria-expanded={mobileMenuOpen}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[0.6rem] font-extrabold text-white/60 transition min-w-0",
              (mobileMenuOpen || overflowActive) && "bg-gradient-to-br from-amber-500 to-amber-300 text-[#111827]",
            )}
          >
            <Menu size={20} />
            <span>القائمة</span>
          </button>
        </nav>
      </div>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[2147482990] bg-black/50 transition-opacity duration-180",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!mobileMenuOpen}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        role="dialog"
        aria-label="كل أقسام الأدمن"
        aria-hidden={!mobileMenuOpen}
        className={cn(
          "fixed right-2 bottom-[calc(88px+env(safe-area-inset-bottom))] left-2 z-[2147483010] grid max-h-[76dvh] gap-3 overflow-auto rounded-2xl border border-white/15 bg-[#121724]/98 p-4 shadow-2xl transition-transform duration-200 ease-out",
          mobileMenuOpen ? "translate-y-0 visible pointer-events-auto" : "translate-y-[calc(100%+120px)] invisible pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[0.6rem] font-extrabold text-[#f3cf73]">
              القائمة الرئيسية
            </span>
            <h2 className="mt-1 text-base font-semibold text-[#fff7e8]">لوحة تحكم FrameID</h2>
          </div>
          <button onClick={toggleMobileMenu} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white/70">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const q = fd.get("mobile-search") as string
            if (q?.trim()) window.location.href = `/admin/search?q=${encodeURIComponent(q.trim())}`
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/60"
        >
          <Search size={16} className="shrink-0" />
          <input ref={searchRef} name="mobile-search" type="text" placeholder="ابحث في لوحة التحكم…" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
          <button type="submit" className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-400 px-3 py-1.5 text-xs font-extrabold text-[#111827]">بحث</button>
        </form>

        <div className="grid gap-2">
          {adminSections.map((section) => {
            const Icon = section.icon
            const sectionActive = isSectionActive(pathname, section.id)
            return (
              <details
                key={section.id}
                ref={(el) => setDetailsRef(section.id, el)}
                className={cn(
                  "overflow-hidden rounded-xl border bg-white/4",
                  sectionActive ? "border-amber-500/30" : "border-white/10",
                )}
              >
                <summary
                  data-accent={section.accent ?? "gold"}
                  className="grid grid-cols-[auto,1fr,auto] gap-2.5 items-center min-h-[56px] p-3 cursor-pointer list-none"
                >
                  {Icon ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400" style={{ gridRow: "span 2" }}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                  ) : null}
                  <strong className="truncate text-sm font-semibold text-[#fff7e8]">{section.title}</strong>
                  {section.shortDescription && (
                    <small className="truncate text-[0.7rem] font-extrabold text-white/50" style={{ gridColumn: 2 }}>{section.shortDescription}</small>
                  )}
                  <ChevronDown size={16} className="text-white/30 transition-transform details-open:rotate-180" style={{ gridRow: "span 2" }} />
                </summary>
                <div className="grid gap-1.5 px-3 pb-3">
                  {section.links.map((link) => {
                    const isActive = isAdminLinkActive(pathname, link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={toggleMobileMenu}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-extrabold text-white/70 no-underline transition",
                          isActive
                            ? "border-amber-500/50 bg-amber-500/15 text-[#fff7e8]"
                            : "border-white/8 bg-black/15 text-white/70 hover:border-amber-500/30 hover:bg-amber-500/10",
                        )}
                      >
                        {link.icon && <link.icon size={17} />}
                        <span>{link.label}</span>
                        {link.badge != null && (
                          <span className="mr-auto inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-gradient-to-br from-[#f3cf73] to-[#b9862f] px-1.5 text-[0.65rem] font-extrabold text-[#17120a]">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/" onClick={toggleMobileMenu} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-extrabold text-white no-underline transition hover:bg-white/10">
            <ExternalLink size={17} />
            العودة للموقع
          </Link>
          <form action="/admin/logout" method="post" className="contents" onSubmit={() => toggleMobileMenu()}>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/10">
              <LogOut size={17} />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
