"use client"

import { Globe, ExternalLink, PlayCircle, XCircle } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerDetail } from "./customer-types"

export function CustomerWebsiteTab({ customer, onAction }: {
  customer: CustomerDetail
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void
}) {
  const formatDate = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-4">
      {customer.sites.length > 0 ? customer.sites.map((site) => (
        <div key={site.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-white">{site.title}</h4>
                <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                  {site.status === "PUBLISHED" ? "منشور" : site.status === "DRAFT" ? "مسودة" : site.status}
                </AdminStatusBadge>
              </div>
              <p className="mt-1 text-sm text-white/40" dir="ltr">{site.slug}.frameid.app</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`https://${site.slug}.frameid.app`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-xs font-extrabold text-white/50 no-underline transition hover:border-amber-500/30 hover:text-[#f3cf73]">
                <ExternalLink size={13} /> فتح الموقع
              </a>
              <form action={async (fd) => {
                fd.set("siteId", site.id); fd.set("tenantId", customer.id)
                fd.set("publish", site.isPublished ? "false" : "true")
                onAction("publish-site", site.isPublished ? "إيقاف الموقع" : "نشر الموقع",
                  site.isPublished ? "سيتم إخفاء الموقع عن الزوار." : "سيتم نشر الموقع للزوار.", fd, site.isPublished)
              }}>
                <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-xs font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73]">
                  {site.isPublished ? <XCircle size={13} /> : <PlayCircle size={13} />}
                  {site.isPublished ? "إيقاف" : "نشر"}
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "القالب", value: site.themeName ?? "—" },
              { label: "الإصدار", value: `v${site.publishedVersion}` },
              { label: "الباقات", value: site.packagesCount },
              { label: "الألبومات", value: site.albumsCount },
              { label: "الخدمات الإضافية", value: site.extrasCount },
              { label: "اللغة", value: site.locale === "ar" ? "العربية" : site.locale },
              { label: "تاريخ الإنشاء", value: formatDate(site.createdAt) },
              { label: "آخر تحديث", value: formatDate(site.updatedAt) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-sm text-white/80">{item.value}</p>
              </div>
            ))}
          </div>

          {site.domains.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-white/40">النطاقات</p>
              <div className="grid gap-1">
                {site.domains.map((d) => (
                  <div key={d.domain} className="flex items-center gap-2 text-sm">
                    <span className="text-white/80" dir="ltr">{d.domain}</span>
                    <AdminStatusBadge tone={d.status === "VERIFIED" ? "success" : "warning"}>{d.status}</AdminStatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {site.seo && (
            <div className="mt-3 rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
              <p className="mb-0.5 text-xs text-white/40">SEO</p>
              <p className="text-sm text-white/80">{site.seo.title}</p>
              {site.seo.description && <p className="mt-0.5 text-xs text-white/50">{site.seo.description}</p>}
            </div>
          )}
        </div>
      )) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-12 text-center">
          <Globe size={32} className="mb-3 text-white/20" />
          <p className="text-sm text-white/40">لا توجد مواقع لهذا العميل</p>
        </div>
      )}
    </div>
  )
}
