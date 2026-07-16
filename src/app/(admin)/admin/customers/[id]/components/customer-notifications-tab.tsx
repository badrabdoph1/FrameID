"use client"

import { Bell, Send } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerNotification } from "./customer-types"
import { useState } from "react"

export function CustomerNotificationsTab({ notifications, onSend }: {
  notifications: CustomerNotification[]
  onSend: (type: string, title: string, body: string) => Promise<boolean>
}) {
  const [form, setForm] = useState({ type: "info", title: "", body: "" })
  const [isSending, setIsSending] = useState(false)
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  const handleSend = async () => {
    setIsSending(true)
    try {
      const sent = await onSend(form.type, form.title.trim(), form.body.trim())
      if (sent) setForm({ type: "info", title: "", body: "" })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">إرسال إشعار جديد</h3>
        <div className="grid gap-3">
          <select
            aria-label="نوع الإشعار"
            name="notificationType"
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            className="min-h-11 rounded-lg border border-white/8 bg-[#171717] px-3 py-2 text-sm text-white outline-none transition focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-300/30"
          >
            <option value="info">معلومات</option>
            <option value="warning">تنبيه</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
          </select>
          <input
            type="text"
            aria-label="عنوان الإشعار"
            name="notificationTitle"
            autoComplete="off"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="مثال: موعد التجديد…"
            className="min-h-11 rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-300/30"
          />
          <textarea
            aria-label="محتوى الإشعار"
            name="notificationBody"
            autoComplete="off"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            placeholder="اكتب الرسالة التي ستصل للعميل…"
            rows={3}
            className="min-h-24 resize-none rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-300/30"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !form.title.trim() || !form.body.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 px-4 py-2.5 text-sm font-extrabold text-[#17120a] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717] disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {!isSending ? <Send aria-hidden="true" size={16} /> : null}
            {isSending ? "جاري الإرسال…" : "إرسال"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">الإشعارات السابقة</h3>
        {notifications.length > 0 ? (
          <div className="grid gap-2">
            {notifications.map((n) => (
              <div key={n.id} className="min-w-0 rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 break-words text-sm font-semibold text-white/80">{n.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <AdminStatusBadge tone={n.type === "error" ? "danger" : n.type === "warning" ? "warning" : n.type === "success" ? "success" : "info"} dot={false}>
                      {n.type}
                    </AdminStatusBadge>
                    {n.readAt && <span className="text-[10px] text-white/30">✓ مقروء</span>}
                  </div>
                </div>
                <p className="mt-0.5 break-words text-xs text-white/50">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-white/25">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell aria-hidden="true" size={24} className="mb-2 text-white/20" />
            <p className="text-sm text-white/35">لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  )
}
