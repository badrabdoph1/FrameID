"use client"

import { Globe, DollarSign, Image, FolderOpen, HardDrive, ShoppingBag, MessageSquare, BarChart3 } from "lucide-react"
import type { CustomerDetail } from "./customer-types"

export function CustomerStatsRow({ customer }: { customer: CustomerDetail }) {
  const bytesToMB = (b: number) => (b / (1024 * 1024)).toFixed(1)

  const stats = [
    { label: "المواقع", value: customer.stats.sitesCount, icon: Globe },
    { label: "المدفوعات", value: customer.stats.paymentsCount, icon: DollarSign },
    { label: "الوسائط", value: customer.stats.mediaCount, icon: Image },
    { label: "الصور", value: customer.stats.totalImages, icon: FolderOpen },
    { label: "المساحة", value: `${bytesToMB(customer.stats.totalStorageBytes)} MB`, icon: HardDrive },
    { label: "الباقات", value: customer.stats.totalPackages, icon: ShoppingBag },
    { label: "الدعم", value: customer.stats.supportCasesCount, icon: MessageSquare },
    { label: "الإيرادات", value: `${customer.stats.totalRevenue.toLocaleString("ar-EG")} ج.م`, icon: BarChart3, accent: true },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-xl border p-3 ${s.accent ? "border-amber-500/20 bg-amber-500/4" : "border-white/8 bg-white/3"}`}>
          <div className="flex items-center gap-1.5">
            <s.icon size={13} className={s.accent ? "text-[#f3cf73]" : "text-white/30"} />
            <span className="text-[0.65rem] font-extrabold text-white/40">{s.label}</span>
          </div>
          <p className={`mt-1.5 text-lg font-bold ${s.accent ? "text-[#f3cf73]" : "text-white"}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
