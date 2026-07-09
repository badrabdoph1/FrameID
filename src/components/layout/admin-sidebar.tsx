"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Search, LogOut, ExternalLink, PanelLeftClose, PanelLeft } from "lucide-react"
import { adminSections, type AdminSection } from "@/modules/admin/navigation"
import { adminLogoutAction } from "@/app/_actions/admin-logout"
import { useAdmin } from "@/components/layout/admin-context"
import { cn } from "@/lib/utils/cn"

function isAdminLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function findActiveAdminSection(pathname: string | null): AdminSection | undefined {
  if (!pathname) return undefined

  const candidates = adminSections
    .map((section) => {
      const bestMatch = section.links
        .filter((link) => isAdminLinkActive(pathname, link.href))
        .sort((a, b) => b.href.length - a.href.length)[0]
      return bestMatch ? { section, matchLength: bestMatch.href.length } : null
    })
    .filter((item): item is { section: AdminSection; matchLength: number } => Boolean(item))
    .sort((a, b) => b.matchLength - a.matchLength)

  return candidates[0]?.section
}

function SecondaryPanel({ sections, collapsed }: { sections: AdminSection[]; collapsed: boolean }) {
  const pathname = usePathname()

  if (collapsed) return null

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-2 admin-scrollbar">
      {sections.map((section) => (
        <div key={section.id} className="mb-3" data-accent={section.accent ?? "gold"}>
          <div className="sticky top-0 z-10 bg-[#0c0e13]/98 pb-2 pt-1">
            {section.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[0.65rem] font-extrabold text-[#f3cf73]">
                {section.badge}
              </span>
            )}
            <h3 className="mt-1 text-sm font-semibold text-[#fff7e8]">{section.title}</h3>
            {section.description && (
              <p className="text-[0.7rem] font-extrabold text-white/50">{section.description}</p>
            )}
          </div>
          <nav className="mt-1 grid gap-0.5">
            {section.links.map((link) => {
              const isActive = isAdminLinkActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-bold text-white/70 transition no-underline hover:bg-amber-500/10 hover:text-white",
                    isActive && "border border-amber-500/20 bg-amber-500/10 text-white before:absolute before:right-1 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#f3cf73] before:content-['']",
                  )}
                >
                  {link.icon && <link.icon size={16} className="shrink-0" />}
                  <span className="truncate">{link.label}</span>
                  {link.badge != null && (
                    <span className="mr-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-[#f3cf73] to-[#b9862f] px-1.5 text-[0.68rem] font-extrabold text-[#17120a] shadow-lg">
                      {link.badge}
                    </span>
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
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAdmin()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const found = findActiveAdminSection(pathname)
    setActiveSection(found?.id ?? adminSections[0]?.id ?? null)
  }, [pathname])

  const setSectionRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) sectionRefs.current.set(id, el)
    else sectionRefs.current.delete(id)
  }, [])

  const goToSection = useCallback((section: AdminSection) => {
    setActiveSection(section.id)
    const firstHref = section.links[0]?.href
    if (firstHref && pathname !== firstHref) router.push(firstHref)
  }, [pathname, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, section: AdminSection) => {
    const idx = adminSections.findIndex((s) => s.id === section.id)
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      goToSection(section)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = adminSections[idx + 1]
      if (next) sectionRefs.current.get(next.id)?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = adminSections[idx - 1]
      if (prev) sectionRefs.current.get(prev.id)?.focus()
    }
  }, [goToSection])

  const currentSections = adminSections.filter((s) => s.id === activeSection)

  return (
    <aside className={cn(
      "fixed right-0 top-0 z-30 flex h-full flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-[#0c0e13] via-[#121318] to-[#181108] text-[#fff8ea] transition-all duration-200",
      sidebarCollapsed ? "w-0 border-0 lg:w-[70px]" : "w-[310px]",
    )}>
      <div className="flex items-center justify-between gap-2 border-b border-white/8 p-3">
        <Link href="/admin" className="flex items-center gap-2.5 rounded-lg border border-white/8 bg-white/4 p-2 no-underline">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
            <rect width="32" height="32" rx="8" fill="url(#brand-grad-sidebar)" />
            <path d="M8 18l4-5.5 4 5.5 4-5.5 4 5.5" stroke="#17120a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <defs>
              <linearGradient id="brand-grad-sidebar" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#f3cf73" />
                <stop offset="1" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          {!sidebarCollapsed && (
            <span className="grid gap-0.5">
              <strong className="text-sm text-[#fff7e8]">FrameID</strong>
              <small className="text-[0.7rem] font-extrabold text-white/60">Admin</small>
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebarCollapsed}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white/70"
          aria-label={sidebarCollapsed ? "توسيع الشريط" : "طي الشريط"}
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {!sidebarCollapsed && (
        <Link
          href="/admin/search"
          className="mx-3 mb-2 mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold text-white/60 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8 hover:text-white"
        >
          <Search size={15} />
          بحث في لوحة التحكم…
          <kbd className="mr-auto inline-flex h-5 min-w-[26px] items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 text-[0.65rem] font-extrabold text-white/40">
            ⌘K
          </kbd>
        </Link>
      )}

      <div className={cn("flex gap-2 overflow-hidden px-3", sidebarCollapsed ? "flex-col pt-4" : "flex-1 pt-2")}>
        <div className={cn(
          "shrink-0 overflow-y-auto overscroll-contain",
          sidebarCollapsed ? "w-full" : "w-[105px]",
        )}>
          <div className="grid gap-1.5">
            {adminSections.map((section) => {
              const Icon = section.icon
              const isSelected = activeSection === section.id
              return (
                <button
                  key={section.id}
                  ref={(el) => setSectionRef(section.id, el)}
                  data-accent={section.accent ?? "gold"}
                  onClick={() => goToSection(section)}
                  onKeyDown={(e) => handleKeyDown(e, section)}
                  title={`${section.title} · فتح ${section.links[0]?.label ?? "القسم"}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative grid gap-1 rounded-xl border p-2 text-start font-inherit transition",
                    isSelected
                      ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-white/4 text-white"
                      : "border-white/8 bg-white/4 text-white/60 hover:border-amber-500/20 hover:bg-amber-500/8 hover:text-white",
                  )}
                >
                  {Icon && (
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                  )}
                  {!sidebarCollapsed && (
                    <>
                      <strong className="truncate text-[0.78rem] font-semibold leading-tight text-[#fff7e8]">{section.title}</strong>
                      {section.shortDescription && (
                        <small className="line-clamp-2 text-[0.6rem] font-extrabold text-white/40">{section.shortDescription}</small>
                      )}
                    </>
                  )}
                  {isSelected && (
                    <span className="absolute right-0 top-2 h-5 w-0.5 rounded-full bg-[#f3cf73]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <SecondaryPanel sections={currentSections} collapsed={sidebarCollapsed} />
      </div>

      <div className="mt-auto shrink-0 border-t border-white/8 p-3">
        <div className="flex gap-2">
          <Link href="/" className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-extrabold text-white no-underline transition hover:bg-white/10">
            <ExternalLink size={16} />
            {!sidebarCollapsed && "الرجوع للموقع"}
          </Link>
          <form action={adminLogoutAction}>
            <button className="flex size-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
