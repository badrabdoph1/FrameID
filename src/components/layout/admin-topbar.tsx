"use client"

import { Bell, Command, Menu, Plus, Search, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useAdmin } from "@/components/layout/admin-context"
import { getAdminBreadcrumbs, getAdminRoute } from "@/modules/admin/navigation"

export function AdminTopbar() {
  const pathname = usePathname()
  const { toggleMobileMenu } = useAdmin()
  const crumbs = getAdminBreadcrumbs(pathname)
  const title = getAdminRoute(pathname)?.labelAr ?? "لوحة الإدارة"
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false)
        setSearchQuery("")
      }
    }

    if (searchOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchOpen])

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      const query = searchQuery.trim()
      if (query) window.location.href = `/admin/search?q=${encodeURIComponent(query)}`
    },
    [searchQuery],
  )

  return (
    <header className="admin-desktop-topbar flex items-center justify-between gap-4 border border-white/10 px-5 py-4 backdrop-blur-2xl lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="فتح كل أقسام الأدمن"
        >
          <Menu size={20} aria-hidden />
        </button>

        <div className="min-w-0">
          <nav aria-label="مسار الصفحة" className="flex items-center gap-1.5 text-[0.72rem] font-extrabold text-white/46">
            {crumbs.map((crumb, index) => {
              const isCurrent = index === crumbs.length - 1
              return (
                <span key={`${crumb.href}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 ? <span aria-hidden className="text-white/18">/</span> : null}
                  {isCurrent ? (
                    <span aria-current="page" className="text-[#f3cf73]">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="no-underline transition hover:text-[#f3cf73]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              )
            })}
          </nav>
          <h1 className="mt-1 truncate bg-gradient-to-l from-[#fff7e8] via-[#f3cf73] to-[#fff7e8] bg-clip-text text-2xl font-black tracking-tight text-transparent xl:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} ref={searchContainerRef} className="flex min-h-11 items-center gap-2 rounded-2xl border border-amber-300/18 bg-black/18 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Search size={16} className="shrink-0 text-[#f3cf73]" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="ابحث في لوحة الإدارة"
              placeholder="عميل، دفعة، موقع أو مشكلة"
              className="min-w-[300px] flex-1 border-0 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/28 xl:min-w-[380px]"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false)
                setSearchQuery("")
              }}
              aria-label="إغلاق البحث"
              className="flex size-8 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/6 hover:text-white/70"
            >
              <X size={14} aria-hidden />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="group hidden min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 text-sm font-extrabold text-white/64 transition hover:border-amber-500/22 hover:bg-amber-500/8 hover:text-white lg:inline-flex"
            aria-label="فتح البحث الشامل"
          >
            <Search size={17} className="text-[#f3cf73]" aria-hidden />
            بحث سريع
            <span className="mr-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/16 px-2 py-1 text-[0.64rem] text-white/36">
              <Command size={11} aria-hidden /> K
            </span>
          </button>
        )}

        <Link
          href="/admin/notifications"
          className="relative flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-[#ffe29a] transition hover:border-amber-500/22 hover:bg-amber-500/8"
          aria-label="الإشعارات"
        >
          <Bell size={18} aria-hidden />
        </Link>

        <Link href="/admin/customers" className="hidden min-h-11 items-center gap-2 rounded-2xl border border-[#f3cf73]/55 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-extrabold text-[#17120a] no-underline shadow-[0_16px_32px_rgba(243,207,115,0.16)] transition hover:-translate-y-0.5 hover:shadow-[#f3cf73]/30 sm:inline-flex">
          <Plus size={18} aria-hidden />
          العملاء
        </Link>

        <div aria-label="حساب المشرف" className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/24 bg-gradient-to-br from-amber-500/18 to-amber-500/8 text-sm font-black text-[#f3cf73] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          م
        </div>
      </div>
    </header>
  )
}
