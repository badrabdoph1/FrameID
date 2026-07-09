"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ExternalLink, Home, LogOut, Menu, Search, X } from "lucide-react"
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

function currentSectionTitle(pathname: string | null) {
  return adminSections.find((section) => isSectionActive(pathname, section.id))?.title ?? "القيادة"
}

export function AdminMobileNav() {
  const pathname = usePathname()
  const { mobileMenuOpen, toggleMobileMenu } = useAdmin()
  const searchRef = useRef<HTMLInputElement>(null)

  const primarySections = useMemo(() => adminSections.slice(0, 4), [])
  const overflowSections = useMemo(() => adminSections.slice(4), [])
  const overflowActive = overflowSections.some((section) => isSectionActive(pathname, section.id))
  const title = currentSectionTitle(pathname)

  useEffect(() => {
    if (mobileMenuOpen) {
      searchRef.current?.focus()
      document.documentElement.classList.add("admin-mobile-menu-open")
    } else {
      document.documentElement.classList.remove("admin-mobile-menu-open")
    }
    return () => document.documentElement.classList.remove("admin-mobile-menu-open")
  }, [mobileMenuOpen])

  return (
    <>
      <header className="admin-mobile-header lg:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMobileMenu}
            className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72"
            aria-label="فتح قائمة الإدارة"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-[#17120a] no-underline shadow-lg">
            <Home className="size-5" />
          </Link>
        </div>

        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-black text-white/36">FrameID Admin</p>
          <h1 className="truncate text-base font-black text-[#fff7e8]">{title}</h1>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link href="/admin/search" className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 no-underline">
            <Search className="size-5" />
          </Link>
          <Link href="/admin/notifications" className="relative grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 no-underline">
            <Bell className="size-5" />
            <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-[#f3cf73] text-[0.65rem] font-black text-[#17120a]">3</span>
          </Link>
        </div>
      </header>

      <div className="admin-mobile-nav-shell lg:hidden">
        <nav aria-label="تنقل الأدمن للموبايل" className="admin-mobile-bottom-bar">
          {primarySections.map((section) => {
            const Icon = section.icon
            const href = section.links[0]?.href ?? "/admin"
            const isActive = isSectionActive(pathname, section.id)
            return (
              <Link key={section.id} href={href} className={cn("admin-mobile-bottom-link", isActive && "is-active")}> 
                <Icon className="size-5" />
                <span>{section.title}</span>
              </Link>
            )
          })}
          <button
            onClick={toggleMobileMenu}
            className={cn("admin-mobile-bottom-link", (mobileMenuOpen || overflowActive) && "is-active")}
            aria-label="فتح كل الأقسام"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="size-5" />
            <span>القائمة</span>
          </button>
        </nav>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="قائمة إدارة FrameID"
        className={cn("admin-mobile-menu-panel lg:hidden", mobileMenuOpen ? "is-open" : "")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#f3cf73]">FrameID Admin</p>
            <h2 className="mt-1 truncate text-lg font-black text-[#fff7e8]">كل مراكز الإدارة</h2>
          </div>
          <button onClick={toggleMobileMenu} className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto px-4 py-4 admin-scrollbar">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("mobile-search") ?? "").trim()
              if (q) window.location.href = `/admin/search?q=${encodeURIComponent(q)}`
            }}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-3xl border border-white/10 bg-white/[0.05] p-2"
          >
            <input ref={searchRef} name="mobile-search" type="text" placeholder="ابحث في العملاء، المدفوعات، الأخطاء…" className="min-h-11 min-w-0 border-0 bg-transparent px-3 text-sm font-bold text-white outline-none placeholder:text-white/28" />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a]">
              <Search className="size-4" /> بحث
            </button>
          </form>

          <section className="grid gap-3">
            {adminSections.map((section) => {
              const Icon = section.icon
              const sectionActive = isSectionActive(pathname, section.id)
              return (
                <article key={section.id} className={cn("rounded-3xl border bg-white/[0.035] p-3", sectionActive ? "border-amber-500/35" : "border-white/10")}>
                  <Link href={section.links[0]?.href ?? "/admin"} onClick={toggleMobileMenu} className="grid grid-cols-[auto,1fr] items-center gap-3 no-underline">
                    <span className={cn("grid size-12 place-items-center rounded-2xl", sectionActive ? "bg-[#f3cf73] text-[#17120a]" : "bg-amber-500/12 text-[#f3cf73]")}> 
                      <Icon className="size-6" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-base font-black text-[#fff7e8]">{section.title}</strong>
                      <small className="mt-1 block truncate text-xs font-bold text-white/42">{section.description}</small>
                    </span>
                  </Link>

                  <div className="mt-3 grid gap-2">
                    {section.links.map((link) => {
                      const LinkIcon = link.icon
                      const active = isAdminLinkActive(pathname, link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={toggleMobileMenu}
                          className={cn(
                            "grid min-h-11 grid-cols-[auto,1fr] items-center gap-2 rounded-2xl border px-3 text-sm font-black no-underline transition",
                            active ? "border-amber-500/40 bg-amber-500/12 text-[#f3cf73]" : "border-white/8 bg-black/14 text-white/58",
                          )}
                        >
                          {LinkIcon ? <LinkIcon className="size-4" /> : null}
                          <span className="truncate">{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </section>

          <div className="grid grid-cols-2 gap-2 pb-4">
            <Link href="/" onClick={toggleMobileMenu} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-black text-white/70 no-underline">
              <ExternalLink className="size-4" /> الموقع
            </Link>
            <form action="/admin/logout" method="post" className="contents" onSubmit={() => toggleMobileMenu()}>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-black text-white/70">
                <LogOut className="size-4" /> خروج
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
