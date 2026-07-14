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
    <div className="admin-desktop-secondary-panel flex-1 overflow-y-auto overscroll-contain px-2 admin-scrollbar">
      {sections.map((section) => (
        <div key={section.id} className="mb-4" data-accent={section.accent ?? "gold"}>
          <div className="sticky top-0 z-10 rounded-2xl border border-white/6 bg-[#0c0e13]/96 px-3 pb-2.5 pt-2.5 shadow-[0_12px_26px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            {section.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-[0.65rem] font-extrabold text-[#f3cf73]">
                {section.badge}
              </span>
            )}
            <h3 className="mt-1.5 text-sm font-black text-[#fff7e8]">{section.title}</h3>
            {section.description && (
              <p className="mt-0.5 line-clamp-2 text-[0.7rem] font-extrabold leading-5 text-white/48">{section.description}</p>
            )}
          </div>
          <nav aria-label={`صفحات ${section.title}`} className="mt-2 grid gap-1.5">
            {section.links.map((link) => {
              const isActive = isAdminLinkActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "admin-desktop-secondary-link group relative flex min-h-10 items-center gap-2.5 rounded-2xl border px-3 py-2 text-[0.82rem] font-extrabold text-white/68 transition no-underline hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-white",
                    isActive
                      ? "border-amber-500/30 bg-amber-500/12 text-white shadow-[0_8px_28px_rgba(243,207,115,0.08)] before:absolute before:right-1.5 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#f3cf73] before:content-['']"
                      : "border-white/7 bg-white/[0.025]",
                  )}
                >
                  {link.icon && <link.icon size={16} className="shrink-0 text-[#f3cf73]/80" />}
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
      "admin-desktop-sidebar fixed right-0 top-0 z-30 flex h-full flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-[#0c0e13] via-[#121318] to-[#181108] text-[#fff8ea] transition-all duration-300 ease-out",
      sidebarCollapsed ? "w-0 border-0 lg:w-[86px]" : "w-[326px]",
    )}>
      <div className="admin-desktop-sidebar-main flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-white/8 p-4">
          <Link href="/admin" className={cn(
            "flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-2.5 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-amber-500/22 hover:bg-amber-500/8",
            sidebarCollapsed && "justify-center"
          )}>
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_16px_rgba(243,207,115,0.24)]">
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
                <strong className="text-base font-black text-[#fff7e8]">FrameID</strong>
                <small className="text-[0.7rem] font-extrabold text-white/54">إدارة FrameID</small>
              </span>
            )}
          </Link>
          <button
            onClick={toggleSidebarCollapsed}
            className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035] text-white/45 transition hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-[#f3cf73]"
            aria-label={sidebarCollapsed ? "توسيع الشريط" : "طي الشريط"}
          >
            {sidebarCollapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <Link
            href="/admin/search"
            className="mx-4 mb-3 mt-3 flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-sm font-extrabold text-white/62 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-white"
          >
            <Search size={15} />
            بحث في لوحة التحكم…
            <kbd className="mr-auto inline-flex h-6 min-w-[30px] items-center justify-center rounded-lg border border-white/10 bg-black/16 px-1.5 text-[0.65rem] font-extrabold text-white/42">
              ⌘K
            </kbd>
          </Link>
        )}

        <div className={cn("flex min-h-0 gap-2 overflow-hidden px-4 pb-3", sidebarCollapsed ? "flex-col pt-4" : "flex-1 pt-1")}> 
          <div className={cn(
            "shrink-0 overflow-y-auto overscroll-contain admin-scrollbar",
            sidebarCollapsed ? "w-full" : "w-[112px]",
          )}>
            <div className="grid gap-2">
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
                      "admin-desktop-primary-section-button group relative grid gap-1.5 rounded-2xl border p-2.5 text-start font-inherit transition duration-200",
                      isSelected
                        ? "border-amber-500/42 bg-gradient-to-br from-amber-500/16 to-white/[0.045] text-white shadow-[0_12px_36px_rgba(243,207,115,0.10)]"
                        : "border-white/8 bg-white/[0.035] text-white/60 hover:border-amber-500/24 hover:bg-amber-500/8 hover:text-white",
                    )}
                  >
                    {Icon && (
                      <span className={cn("grid size-8 place-items-center rounded-2xl transition", isSelected ? "bg-amber-500/18 text-[#f3cf73]" : "bg-white/[0.045] text-amber-300/72 group-hover:text-[#f3cf73]")}> 
                        <Icon size={16} aria-hidden="true" />
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <>
                        <strong className="truncate text-[0.78rem] font-black leading-tight text-[#fff7e8]">{section.title}</strong>
                        {section.shortDescription && (
                          <small className="line-clamp-2 text-[0.6rem] font-extrabold leading-4 text-white/40">{section.shortDescription}</small>
                        )}
                      </>
                    )}
                    {isSelected && (
                      <span className="absolute right-0 top-3 h-8 w-0.5 rounded-full bg-[#f3cf73] shadow-[0_0_14px_rgba(243,207,115,0.7)]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <SecondaryPanel sections={currentSections} collapsed={sidebarCollapsed} />
        </div>

        <div className="mt-auto shrink-0 border-t border-white/8 p-4">
          <div className={cn("flex gap-2", sidebarCollapsed && "justify-center")}> 
            <Link href="/" className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3 text-sm font-extrabold text-white no-underline transition hover:border-amber-500/20 hover:bg-white/10",
              sidebarCollapsed ? "size-[46px] px-0" : "flex-1"
            )}>
              <ExternalLink size={16} />
              {!sidebarCollapsed && "الرجوع للموقع"}
            </Link>
            <form action={adminLogoutAction}>
              <button aria-label="تسجيل الخروج" className="flex size-[46px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-white/70 transition hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-200">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}
