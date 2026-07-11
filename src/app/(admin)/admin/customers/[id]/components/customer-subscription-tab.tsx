"use client"

import { CreditCard, RefreshCw, PlayCircle, Ban } from "lucide-react"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import type { CustomerDetail, CustomerSubscriptionInfo } from "./customer-types"

export function CustomerSubscriptionTab({ customer, allSubscriptions, onAction }: {
  customer: CustomerDetail
  allSubscriptions: CustomerSubscriptionInfo[]
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void
}) {
  const formatDate = (d: string | null) => {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
  }

  const subTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success", TRIAL: "warning", EXPIRED: "danger", PAST_DUE: "danger",
    CANCELLED: "default", SUSPENDED: "danger",
  }

  return (
    <div className="space-y-6">
      {customer.subscription ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-4 text-sm font-semibold text-white/60">الاشتراك الحالي</h3>
            <div className="grid gap-2.5">
              <SubRow label="الخطة" value={customer.subscription.planName ?? "بدون خطة"} />
              {customer.subscription.planPrice && <SubRow label="السعر" value={`${customer.subscription.planPrice.toLocaleString("ar-EG")} ج.م`} />}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">الحالة</span>
                <AdminStatusBadge tone={subTone[customer.subscription.status] || "default"}>{customer.subscription.status}</AdminStatusBadge>
              </div>
              <SubRow label="بداية الفترة" value={formatDate(customer.subscription.currentPeriodStart)} />
              <SubRow label="نهاية الفترة" value={formatDate(customer.subscription.currentPeriodEnd)} />
              {customer.subscription.expiresAt && <SubRow label="تاريخ الانتهاء" value={formatDate(customer.subscription.expiresAt)} />}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {customer.subscription.status !== "ACTIVE" && (
                <form action={async (fd) => { fd.set("subscriptionId", customer.subscription!.id); fd.set("tenantId", customer.id); onAction("activate-subscription", "تفعيل الاشتراك", "سيتم تفعيل الاشتراك لهذا العميل.", fd) }}>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-extrabold text-emerald-400 transition hover:bg-emerald-500/10">
                    <PlayCircle size={14} /> تفعيل الاشتراك
                  </button>
                </form>
              )}
              {customer.subscription.status !== "CANCELLED" && customer.subscription.status !== "EXPIRED" && (
                <form action={async (fd) => { fd.set("subscriptionId", customer.subscription!.id); fd.set("tenantId", customer.id); onAction("cancel-subscription", "إلغاء الاشتراك", "سيتم إلغاء الاشتراك الحالي.", fd, true) }}>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-extrabold text-red-400/60 transition hover:border-red-400/40 hover:text-red-400">
                    <Ban size={14} /> إلغاء الاشتراك
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-4 text-sm font-semibold text-white/60">التجربة المجانية</h3>
            <div className="grid gap-2.5">
              <SubRow label="تاريخ البداية" value={formatDate(customer.trialStartedAt)} />
              <SubRow label="تاريخ النهاية" value={formatDate(customer.trialEndsAt)} />
            </div>
            {customer.trialEndsAt && (
              <div className={`mt-3 rounded-lg border px-3.5 py-2.5 ${new Date(customer.trialEndsAt) > new Date() ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <p className={`text-xs font-extrabold ${new Date(customer.trialEndsAt) > new Date() ? "text-amber-400/80" : "text-red-400/80"}`}>
                  {new Date(customer.trialEndsAt) > new Date()
                    ? `باقي ${Math.ceil((new Date(customer.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوماً`
                    : "انتهت التجربة"}
                </p>
              </div>
            )}
            <form action={async (fd) => { fd.set("tenantId", customer.id); fd.set("days", "14"); onAction("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يوماً؟`, fd) }}>
              <button type="submit" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-3 py-1.5 text-xs font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73]">
                <RefreshCw size={14} /> تمديد التجربة 14 يوماً
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-12 text-center">
          <CreditCard size={32} className="mb-3 text-white/20" />
          <p className="text-sm text-white/40">لا يوجد اشتراك لهذا العميل</p>
        </div>
      )}

      {allSubscriptions.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white/60">سجل الاشتراكات</h3>
          <div className="grid gap-2">
            {allSubscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">{sub.planName ?? "بدون خطة"}</p>
                  <p className="text-xs text-white/40">{formatDate(sub.createdAt)} {sub.currentPeriodEnd && `→ ${formatDate(sub.currentPeriodEnd)}`}</p>
                </div>
                <AdminStatusBadge tone={subTone[sub.status] || "default"}>{sub.status}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  )
}
