"use client"

import { Image as ImageIcon, FileText, Download, Search } from "lucide-react"
import type { CustomerMediaAsset } from "./customer-types"

export function CustomerMediaTab({ media, searchQuery, onSearchChange }: {
  media: CustomerMediaAsset[]
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const bytesToMB = (b: number) => (b / (1024 * 1024)).toFixed(1)
  const totalMB = media.reduce((s, m) => s + m.sizeBytes, 0)
  const maxMB = Math.max(parseInt(bytesToMB(totalMB)) + 500, 1000)

  const filtered = media.filter((m) =>
    !searchQuery || m.alt?.toLowerCase().includes(searchQuery.toLowerCase()) || m.mimeType?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-2.5">
        <span className="text-sm text-white/60">المساحة المستخدمة</span>
        <span className="text-sm font-semibold text-white">{bytesToMB(totalMB)} MB من أصل {maxMB} MB</span>
      </div>

      <div className="relative">
        <Search aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          aria-label="البحث في ملفات العميل"
          name="customerMediaSearch"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث في الوسائط…"
          className="min-h-11 w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-10 pl-4 text-sm text-white outline-none transition placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-300/30"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/3">
              {asset.mimeType.startsWith("image/") ? (
                <div className="flex aspect-square items-center justify-center bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.alt ?? ""} className="size-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-white/5">
                  <FileText aria-hidden="true" size={32} className="text-white/20" />
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs text-white/60">{asset.alt ?? asset.mimeType}</p>
                <p className="text-[10px] text-white/30">{bytesToMB(asset.sizeBytes)} MB</p>
              </div>
              <a
                aria-label={`تنزيل ${asset.alt ?? "الملف"}`}
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute left-2 top-2 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-black/75 text-white shadow-lg transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
              >
                <Download aria-hidden="true" size={16} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-8 text-center">
          <ImageIcon aria-hidden="true" size={32} className="mb-3 text-white/20" />
          <p className="text-sm text-white/40">لا توجد ملفات وسائط</p>
        </div>
      )}
    </div>
  )
}
