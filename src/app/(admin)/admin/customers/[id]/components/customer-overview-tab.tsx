"use client"

import { AdminActivityTimeline } from "@/components/layout/admin-activity-timeline"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import { buildPublicSiteUrl } from "@/lib/public-site-url"
import type { CustomerDetail } from "./customer-types"
import type { TabId } from "./customer-tabs"

export function CustomerOverviewTab({ customer, platformBaseUrl, onTabChange }: { customer: CustomerDetail; platformBaseUrl: string; onTabChange: (tab: TabId) => void }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-xs font-black text-white/55">المواقع</h3>
          <button type="button" onClick={() => onTabChange("site")} className="min-h-11 rounded-lg px-2 text-xs font-extrabold text-amber-500/70 transition hover:bg-amber-300/[0.06] hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50">عرض الكل</button>
        </div>
        {customer.sites.length > 0 ? (
          <div className="grid gap-2">
            {customer.sites.slice(0, 3).map((site) => {
              const siteUrl = buildPublicSiteUrl(platformBaseUrl, site.slug)

              return <div key={site.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white/80">{site.title}</p>
                  <p className="break-all text-xs text-white/40" dir="ltr">{siteUrl} {site.themeName && `· ${site.themeName}`}</p>
                </div>
                <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                  {site.status === "PUBLISHED" ? "منشور" : site.status}
                </AdminStatusBadge>
              </div>
            })}
          </div>
        ) : (
          <p className="text-sm text-white/35">لا توجد مواقع</p>
        )}
      </section>

      <section className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
        <h3 className="mb-2.5 text-xs font-black text-white/55">آخر النشاطات</h3>
        {customer.recentActivity.length > 0 ? (
          <AdminActivityTimeline events={customer.recentActivity.slice(0, 5).map((a) => ({
            id: a.id,
            action: a.action,
            description: `${a.entityType} · ${a.actorName ?? "النظام"}`,
            timestamp: a.createdAt,
          }))} />
        ) : (
          <p className="text-sm text-white/35">لا يوجد نشاط</p>
        )}
      </section>
    </div>
  )
}
