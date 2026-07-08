"use client"

import { Smartphone, Monitor, Laptop, Ban } from "lucide-react"
import type { CustomerDetail } from "./customer-types"

export function CustomerSessionsTab({ customer, onAction }: {
  customer: CustomerDetail
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void
}) {
  const formatDateTime = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-3">
      {customer.sessions.length > 0 ? customer.sessions.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          {s.userAgent?.includes("Mobile")
            ? <Smartphone size={18} className="shrink-0 text-white/30" />
            : s.userAgent?.includes("Tablet")
              ? <Monitor size={18} className="shrink-0 text-white/30" />
              : <Laptop size={18} className="shrink-0 text-white/30" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white/80">{s.ipAddress ?? "—"} · {s.userAgent?.slice(0, 50) ?? "—"}</p>
            <p className="text-xs text-white/40">{formatDateTime(s.lastSeenAt || s.createdAt)}</p>
          </div>
          <form action={async (fd) => { fd.set("sessionId", s.id); fd.set("tenantId", customer.id); onAction("revoke-session", "إلغاء الجلسة", "سيتم إنهاء جلسة المستخدم هذه.", fd, true) }}>
            <button type="submit" className="flex shrink-0 items-center gap-1 rounded-lg border border-red-500/15 px-2 py-1 text-xs font-extrabold text-red-400/60 transition hover:border-red-400/30 hover:text-red-400">
              <Ban size={12} /> إلغاء
            </button>
          </form>
        </div>
      )) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-12 text-center">
          <Smartphone size={32} className="mb-3 text-white/20" />
          <p className="text-sm text-white/40">لا توجد جلسات نشطة</p>
        </div>
      )}
    </div>
  )
}
