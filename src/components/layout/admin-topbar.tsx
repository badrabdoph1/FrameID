"use client"

import { Search, Bell, Plus, Menu, X, Command } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useCallback, useRef, useEffect } from "react"
import { useAdmin } from "@/components/layout/admin-context"

const breadcrumbLabels: Record<string, string> = {
  admin: "لوحة التحكم",
  customers: "العملاء",
  sites: "المواقع",
  subscriptions: "الاشتراكات",
  payments: "المدفوعات",
  templates: "القوالب",
  content: "المحتوى",
  media: "الوسائط",
  themes: "السمات",
  backups: "النسخ الاحتياطي",
  analytics: "التحليلات",
  audit: "سجل التدقيق",
  errors: "الأخطاء",
  notifications: "الإشعارات",
  security: "الأمان",
  support: "الدعم",
  health: "صحة النظام",
  "feature-flags": "أعلام الميزات",
  settings: "إعدادات المنصة",
  marketing: "التسويق",
  search: "بحث",
  messages: "الرسائل",
  billing: "المال",
  system: "النظام",
}

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let href = ""
  for (const seg of segments) {
    const isId = /^[0-9a-f]{8,}$/i.test(seg)
    href += "/" + seg
    const label = isId ? `#${seg.slice(0, 8)}` : (breadcrumbLabels[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    crumbs.push({ label, href })
  }
  return crumbs
}

export function AdminTopbar() {
  const pathname = usePathname()
  const { toggleMobileMenu } = useAdmin()
  const crumbs = useBreadcrumbs(pathname)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
        setSearchQuery("")
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchOpen])

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/admin/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }, [searchQuery])

  const getPageTitle = useCallback(() => {
    if (crumbs.length <= 1) return ""
    return crumbs[crumbs.length - 1]?.label ?? ""
  }, [crumbs])

  const title = getPageTitle() || "لوحة التحكم"

  return (
    <header className="admin-desktop-topbar flex items-center justify-between gap-4 border border-white/10 px-5 py-4 backdrop-blur-2xl lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="القائمة"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-[0.72rem] font-extrabold text-white/46">
            <Link href="/admin" className="transition hover:text-[#f3cf73] no-underline">لوحة التحكم</Link>
            {crumbs.length > 1 && crumbs.slice(1).map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <span className="text-white/18">/</span>
                <Link href={crumb.href} className="transition hover:text-[#f3cf73] no-underline last:text-[#f3cf73]">
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="mt-1 truncate bg-gradient-to-l from-[#fff7e8] via-[#f3cf73] to-[#fff7e8] bg-clip-text text-2xl font-black tracking-tight text-transparent xl:text-3xl">{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="flex min-h-11 items-center gap-2 rounded-2xl border border-amber-300/18 bg-black/18 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Search size={16} className="shrink-0 text-[#f3cf73]" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في العملاء، المدفوعات، المواقع…"
              className="min-w-[300px] flex-1 border-0 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/28 xl:min-w-[380px]"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery("") }}
              className="flex size-7 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/6 hover:text-white/70"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="group hidden min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 text-sm font-extrabold text-white/64 transition hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-white lg:inline-flex"
            aria-label="بحث"
          >
            <Search size={17} className="text-[#f3cf73]" />
            بحث سريع
            <span className="mr-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/16 px-2 py-1 text-[0.64rem] text-white/36">
              <Command size={11} /> K
            </span>
          </button>
        )}

        <Link
          href="/admin/notifications"
          className="relative flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-[#ffe29a] transition hover:border-amber-500/22 hover:bg-amber-500/8"
          aria-label="الإشعارات"
        >
          <Bell size={18} />
          <span className="absolute -left-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-[#f3cf73] to-[#b9862f] px-1 text-[0.6rem] font-extrabold text-[#17120a] shadow-lg">
            3
          </span>
        </Link>

        <Link href="/admin/customers" className="hidden min-h-11 items-center gap-2 rounded-2xl border border-[#f3cf73]/55 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-extrabold text-[#17120a] no-underline shadow-[0_16px_32px_rgba(243,207,115,0.16)] transition hover:-translate-y-0.5 hover:shadow-[#f3cf73]/30 sm:inline-flex">
          <Plus size={18} />
          العملاء
        </Link>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/24 bg-gradient-to-br from-amber-500/18 to-amber-500/8 text-sm font-black text-[#f3cf73] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          A
        </div>
      </div>
    </header>
  )
}