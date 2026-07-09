"use client"

import { usePathname } from "next/navigation"
import { AdminProvider, useAdmin } from "@/components/layout/admin-context"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminTopbar } from "@/components/layout/admin-topbar"
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils/cn"
import "@/app/admin.css"

function RouteChangeProgress() {
  const pathname = usePathname()

  useEffect(() => {
    const bar = document.querySelector<HTMLDivElement>("#admin-route-progress")
    if (!bar) return
    bar.style.display = "block"
    const id = setTimeout(() => {
      bar.style.display = "none"
    }, 400)
    return () => clearTimeout(id)
  }, [pathname])

  return <div id="admin-route-progress" className="admin-route-progress" style={{ display: "none" }} />
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAdmin()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="admin-dark-shell min-h-screen overflow-x-hidden bg-[#0b0d12] text-[#f5ead6] color-scheme-dark">
      <RouteChangeProgress />

      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div
        className={cn(
          "min-w-0 transition-all duration-200",
          mounted && !sidebarCollapsed ? "lg:mr-[310px]" : "lg:mr-0",
        )}
      >
        <main className="min-h-screen overflow-x-hidden px-3 pb-[calc(112px+env(safe-area-inset-bottom))] pt-[calc(82px+env(safe-area-inset-top))] sm:px-4 lg:p-6">
          <div className="hidden lg:block">
            <AdminTopbar />
          </div>
          <div className="lg:mt-4">{children}</div>
        </main>
      </div>

      <AdminMobileNav />
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <ShellContent>{children}</ShellContent>
    </AdminProvider>
  )
}
