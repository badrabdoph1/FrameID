"use client"

import { Mail, Phone, Calendar, Clock, CheckCircle2, User } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerDetail } from "./customer-types"

export function CustomerInfoPanel({ customer }: { customer: CustomerDetail }) {
  const statusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    TRIAL: "warning", ACTIVE: "success", EXPIRED: "danger", SUSPENDED: "danger",
  }

  const formatDate = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
  }
  const formatDateTime = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="rounded-xl border border-white/8 bg-gradient-to-br from-white/4 to-transparent p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-xl font-bold text-[#f3cf73] sm:size-16 sm:text-2xl">
            {customer.displayName.charAt(0)}
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white sm:text-xl">{customer.displayName}</h2>
              <AdminStatusBadge tone={statusTone[customer.status] || "default"}>
                {customer.status === "ACTIVE" ? "نشط" : customer.status === "TRIAL" ? "تجربة" : customer.status === "SUSPENDED" ? "موقوف" : customer.status === "EXPIRED" ? "منتهي" : customer.status}
              </AdminStatusBadge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
              <span className="inline-flex items-center gap-1.5"><Mail size={14} /> {customer.owner.email}</span>
              {customer.owner.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {customer.owner.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> منذ {formatDate(customer.createdAt)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} /> آخر نشاط: {formatDateTime(customer.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoBlock label="الاسم" value={customer.owner.name} icon={User} />
        <InfoBlock label="البريد الإلكتروني" value={customer.owner.email} icon={Mail} />
        <InfoBlock label="الهاتف" value={customer.owner.phone ?? "—"} icon={Phone} />
        <InfoBlock label="تاريخ التسجيل" value={formatDate(customer.createdAt)} icon={Calendar} />
        <InfoBlock label="آخر تحديث" value={formatDateTime(customer.updatedAt)} icon={Clock} />
        <InfoBlock label="البريد الموثق" value={customer.owner.emailVerifiedAt ? "موثق" : "غير موثق"} icon={CheckCircle2} />
      </div>
    </div>
  )
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: typeof User }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
      <Icon size={15} className="shrink-0 text-white/30" />
      <div className="min-w-0">
        <p className="text-[0.7rem] font-extrabold text-white/40">{label}</p>
        <p className="truncate text-sm text-white/80">{value}</p>
      </div>
    </div>
  )
}
