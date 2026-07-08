"use client"

import { AdminActivityTimeline } from "@/components/layout/admin-activity-timeline"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerDetail } from "./customer-types"

export function CustomerOverviewTab({ customer, onTabChange }: { customer: CustomerDetail; onTabChange: (tab: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/60">المواقع</h3>
          <button onClick={() => onTabChange("website")} className="text-xs font-extrabold text-amber-500/70 transition hover:text-amber-400">عرض الكل</button>
        </div>
        {customer.sites.length > 0 ? (
          <div className="grid gap-2">
            {customer.sites.slice(0, 3).map((site) => (
              <div key={site.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white/80">{site.title}</p>
                  <p className="text-xs text-white/40" dir="ltr">{site.slug}.frameid.app {site.themeName && `· ${site.themeName}`}</p>
                </div>
                <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                  {site.status === "PUBLISHED" ? "منشور" : site.status}
                </AdminStatusBadge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/35">لا توجد مواقع</p>
        )}
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/60">آخر النشاطات</h3>
          <button onClick={() => onTabChange("activity")} className="text-xs font-extrabold text-amber-500/70 transition hover:text-amber-400">عرض الكل</button>
        </div>
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
      </div>
    </div>
  )
}
