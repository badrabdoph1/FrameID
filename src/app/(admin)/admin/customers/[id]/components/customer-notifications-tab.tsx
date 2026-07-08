"use client"

import { Bell, Send } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerNotification } from "./customer-types"
import { useState } from "react"

export function CustomerNotificationsTab({ notifications, onSend }: {
  notifications: CustomerNotification[]
  onSend: (type: string, title: string, body: string) => void
}) {
  const [form, setForm] = useState({ type: "info", title: "", body: "" })
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">إرسال إشعار جديد</h3>
        <div className="grid gap-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500/50"
          >
            <option value="info">معلومات</option>
            <option value="warning">تنبيه</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
          </select>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="عنوان الإشعار"
            className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="محتوى الإشعار"
            rows={3}
            className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 resize-none"
          />
          <button
            onClick={() => { onSend(form.type, form.title, form.body); setForm({ type: "info", title: "", body: "" }) }}
            disabled={!form.title || !form.body}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 px-4 py-2.5 text-sm font-extrabold text-[#17120a] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Send size={16} />
            إرسال
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">الإشعارات السابقة</h3>
        {notifications.length > 0 ? (
          <div className="grid gap-2">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white/80">{n.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <AdminStatusBadge tone={n.type === "error" ? "danger" : n.type === "warning" ? "warning" : n.type === "success" ? "success" : "info"} dot={false}>
                      {n.type}
                    </AdminStatusBadge>
                    {n.readAt && <span className="text-[10px] text-white/30">✓ مقروء</span>}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-white/50">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-white/25">{formatDateTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell size={24} className="mb-2 text-white/20" />
            <p className="text-sm text-white/35">لا توجد إشعارات</p>
          </div>
        )}
      </div>
    </div>
  )
}
