"use client"

import { usePathname } from "next/navigation"
import { AdminProvider } from "@/components/layout/admin-context"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminTopbar } from "@/components/layout/admin-topbar"
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav"
import { useEffect } from "react"
import "@/app/admin.css"

function RouteChangeProgress() {
  const pathname = usePathname()

  useEffect(() => {
    const bar = document.querySelector<HTMLDivElement>("#admin-route-progress")
    if (!bar) return
    bar.classList.remove("animate-fade-in")
    bar.style.display = "block"
    const id = setTimeout(() => {
      bar.classList.add("animate-fade-in")
      bar.style.display = "none"
    }, 340)
    return () => clearTimeout(id)
  }, [pathname])

  return (
    <div
      id="admin-route-progress"
      className="admin-route-progress"
      style={{ display: "none" }}
    />
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <RouteChangeProgress />
      <div className="admin-dark-shell">
        <div className="dashboard-layout">
          <AdminSidebar />
          <main className="dashboard-main admin-scrollbar">
            <AdminTopbar />
            <div className="dashboard-content">{children}</div>
          </main>
        </div>
      </div>
      <AdminMobileNav />
    </AdminProvider>
  )
}
