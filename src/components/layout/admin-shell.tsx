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
    <div className="flex min-h-screen bg-[#0b0d12] text-[#f5ead6] color-scheme-dark">
      <RouteChangeProgress />
      <AdminSidebar />
      <div className={cn(
        "flex min-w-0 flex-1 flex-col transition-all duration-200",
        mounted && !sidebarCollapsed ? "lg:mr-[310px]" : "lg:mr-0",
      )}>
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6 admin-scrollbar">
          <AdminTopbar />
          <div className="mt-4">{children}</div>
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
