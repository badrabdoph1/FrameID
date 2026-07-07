"use client"

import { usePathname } from "next/navigation"
import { AdminProvider } from "@/components/layout/admin-context"
import { ClientSidebar } from "@/components/layout/client-sidebar"
import { ClientTopbar } from "@/components/layout/client-topbar"
import { ClientMobileNav } from "@/components/layout/client-mobile-nav"
import { useEffect } from "react"
import "@/app/admin.css"

function RouteChangeProgress() {
  const pathname = usePathname()

  useEffect(() => {
    const bar = document.querySelector<HTMLDivElement>("#client-route-progress")
    if (!bar) return
    bar.classList.remove("animate-fade-in")
    bar.style.display = "block"
    const id = setTimeout(() => {
      bar.classList.add("animate-fade-in")
      bar.style.display = "none"
    }, 340)
    return () => clearTimeout(id)
  }, [pathname])

  return <div id="client-route-progress" className="admin-route-progress" style={{ display: "none" }} />
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <RouteChangeProgress />
      <div className="admin-dark-shell">
        <div className="dashboard-layout">
          <ClientSidebar />
          <main className="dashboard-main admin-scrollbar">
            <ClientTopbar />
            <div className="dashboard-content">{children}</div>
          </main>
        </div>
      </div>
      <ClientMobileNav />
    </AdminProvider>
  )
}
