"use client"

import { DollarSign } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerDetail } from "./customer-types"

export function CustomerPaymentsTab({ customer }: { customer: CustomerDetail }) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="space-y-4">
      {customer.recentPayments.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/3">
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">التاريخ</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">المبلغ</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">الطريقة</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">الحالة</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">المرجع</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">إثبات</th>
                  <th className="px-3 py-2.5 text-right text-xs font-extrabold text-white/40">المراجع</th>
                </tr>
              </thead>
              <tbody>
                {customer.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-white/8 last:border-0 hover:bg-white/3">
                    <td className="px-3 py-2.5 text-white/60">{formatDate(p.createdAt)}</td>
                    <td className="px-3 py-2.5 font-semibold text-white/80">{p.amount.toLocaleString("ar-EG")} {p.currency}</td>
                    <td className="px-3 py-2.5 text-white/60">{p.method}</td>
                    <td className="px-3 py-2.5">
                      <AdminStatusBadge tone={p.status === "APPROVED" ? "success" : p.status === "REJECTED" ? "danger" : "warning"}>
                        {p.status === "APPROVED" ? "مقبول" : p.status === "REJECTED" ? "مرفوض" : "معلق"}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-3 py-2.5 text-white/60" dir="ltr">{p.reference ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {p.proofUrl ? (
                        <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-amber-500/70 transition hover:text-amber-400">
                          عرض الإثبات
                        </a>
                      ) : <span className="text-white/40">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-white/60">{p.reviewedByName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-amber-500/10 bg-amber-500/4 px-4 py-3">
            <p className="text-xs text-amber-500/60">إجمالي الإيرادات المعتمدة</p>
            <p className="text-lg font-bold text-[#f3cf73]">{customer.stats.totalRevenue.toLocaleString("ar-EG")} ج.م</p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-12 text-center">
          <DollarSign size={32} className="mb-3 text-white/20" />
          <p className="text-sm text-white/40">لا توجد مدفوعات</p>
        </div>
      )}
    </div>
  )
}
