"use client"

import { Search, Bell, Plus, Menu, X } from "lucide-react"
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
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0c0e13]/80 px-4 py-3 shadow-2xl backdrop-blur-lg lg:px-5 lg:py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="القائمة"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-[0.72rem] font-extrabold text-white/50">
            <Link href="/admin" className="transition hover:text-[#f3cf73] no-underline">لوحة التحكم</Link>
            {crumbs.length > 1 && crumbs.slice(1).map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <span className="text-white/20">/</span>
                <Link href={crumb.href} className="transition hover:text-[#f3cf73] no-underline last:text-[#f3cf73]">
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="mt-0.5 truncate text-lg font-bold text-[#fff7e8] sm:text-xl">{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <Search size={16} className="shrink-0 text-white/40" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في لوحة التحكم…"
              className="min-w-[160px] flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery("") }}
              className="flex size-6 items-center justify-center rounded-md text-white/30 transition hover:bg-white/5 hover:text-white/60"
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#ffe29a] transition hover:border-amber-500/20 hover:bg-white/10"
            aria-label="بحث"
          >
            <Search size={18} />
          </button>
        )}

        <Link
          href="/admin/notifications"
          className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#ffe29a] transition hover:border-amber-500/20 hover:bg-white/10"
          aria-label="الإشعارات"
        >
          <Bell size={18} />
          <span className="absolute -left-1.5 -top-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-[#f3cf73] to-[#b9862f] px-1 text-[0.6rem] font-extrabold text-[#17120a] shadow-lg">
            3
          </span>
        </Link>

        <Link href="/admin/customers/new" className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#f3cf73]/60 bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 px-4 py-2.5 text-sm font-extrabold text-[#17120a] no-underline shadow-lg transition hover:-translate-y-0.5 hover:shadow-[#f3cf73]/30">
          <Plus size={18} />
          إنشاء جديد
        </Link>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-amber-500/20 to-amber-500/8 text-sm font-bold text-[#f3cf73]">
          A
        </div>
      </div>
    </header>
  )
}
