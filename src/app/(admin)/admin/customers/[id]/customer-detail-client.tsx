"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Globe, CreditCard, Bell, Activity } from "lucide-react"
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog"
import type {
  CustomerDetail, CustomerMediaAsset, CustomerNotification,
  CustomerAdminNote, CustomerSubscriptionInfo,
} from "@/modules/admin/customers/customer-types"

import { CustomerInfoPanel } from "./components/customer-info-panel"
import { CustomerQuickActions } from "./components/customer-quick-actions"
import { CustomerTabBar, type TabId } from "./components/customer-tabs"
import { CustomerOverviewTab } from "./components/customer-overview-tab"
import { CustomerWebsiteTab } from "./components/customer-website-tab"
import { CustomerSubscriptionTab } from "./components/customer-subscription-tab"
import { CustomerPaymentsTab } from "./components/customer-payments-tab"
import { CustomerMediaTab } from "./components/customer-media-tab"
import { CustomerSessionsTab } from "./components/customer-sessions-tab"
import { CustomerNotificationsTab } from "./components/customer-notifications-tab"
import { CustomerNotesTab } from "./components/customer-notes-tab"

import {
  suspendCustomerAction, activateCustomerAction, archiveCustomerAction,
  deleteCustomerAction, resetCustomerPasswordAction,
  extendCustomerTrialAction, activateCustomerSubscriptionAction,
  cancelCustomerSubscriptionAction, publishSiteAction, suspendSiteAction,
  revokeSessionAction, createAdminNoteAction, deleteAdminNoteAction,
  sendNotificationAction,
} from "@/app/(admin)/admin/customers/actions"

type Props = {
  initialTab: TabId
  customer: CustomerDetail
  media: CustomerMediaAsset[]
  notifications: CustomerNotification[]
  adminNotes: CustomerAdminNote[]
  allSubscriptions: CustomerSubscriptionInfo[]
}

function daysLeft(value: string | null): string {
  if (!value) return "—"
  const diff = new Date(value).getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return "ينتهي اليوم"
  return `${days} يوم متبقي`
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString("ar-EG")} ج.م`
}

export function CustomerDetailClient({ initialTab, customer, media, notifications, adminNotes, allSubscriptions }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; description: string; danger?: boolean; formData?: FormData } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const showMsg = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])
  const changeTab = useCallback((tab: TabId) => { setActiveTab(tab); router.replace(`/admin/customers/${customer.id}?tab=${tab}`) }, [customer.id, router])

  const handleAction = useCallback(async (actionType: string, formData: FormData) => {
    try {
      const actions: Record<string, (d: FormData) => Promise<void>> = {
        suspend: suspendCustomerAction, activate: activateCustomerAction,
        archive: archiveCustomerAction, delete: deleteCustomerAction,
        "reset-password": resetCustomerPasswordAction,
        "extend-trial": extendCustomerTrialAction,
        "activate-subscription": activateCustomerSubscriptionAction,
        "cancel-subscription": cancelCustomerSubscriptionAction,
        "publish-site": publishSiteAction, "suspend-site": suspendSiteAction,
        "revoke-session": revokeSessionAction,
        "create-note": createAdminNoteAction, "delete-note": deleteAdminNoteAction,
        "send-notification": sendNotificationAction,
      }
      await actions[actionType]?.(formData)
      showMsg("success", "تمت العملية بنجاح")
      router.refresh()
    } catch {
      showMsg("error", "فشلت العملية")
    }
  }, [router, showMsg])

  const showConfirm = (type: string, title: string, description: string, formData: FormData, danger?: boolean) => {
    setConfirmAction({ type, title, description, danger, formData })
  }

  const confirmAndExecute = async () => {
    if (!confirmAction?.formData) return
    const { type, formData } = confirmAction
    setConfirmAction(null)
    await handleAction(type, formData)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showMsg("success", "تم النسخ"))
  }

  const siteSlug = customer.sites[0]?.slug ?? ""
  const siteUrl = siteSlug ? `https://${siteSlug}.frameid.app` : null
  const trial = daysLeft(customer.trialEndsAt)
  const openCases = customer.stats.supportCasesCount

  const metrics = [
    { label: "الحالة", value: customer.status === "ACTIVE" ? "نشط" : customer.status === "TRIAL" ? "تجريبي" : customer.status === "SUSPENDED" ? "موقوف" : customer.status === "EXPIRED" ? "منتهي" : customer.status, icon: Activity },
    { label: "التجربة", value: trial, icon: Bell },
    { label: "المواقع", value: customer.stats.sitesCount.toLocaleString("ar-EG"), icon: Globe },
    { label: "الإيرادات", value: formatMoney(customer.stats.totalRevenue), icon: CreditCard },
    { label: "الدعم", value: `${openCases.toLocaleString("ar-EG")}`, icon: Bell, danger: openCases > 0 },
  ]

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-extrabold ${
          message.type === "success"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/20 bg-red-500/10 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className={`rounded-2xl border bg-white/[0.035] p-4 ${m.danger ? "border-red-300/20" : "border-white/10"}`}>
            <p className={`text-xl font-black ${m.danger ? "text-red-300" : "text-[#fff7e8]"}`}>{m.value}</p>
            <p className="mt-1 text-xs font-black text-white/38">{m.label}</p>
          </div>
        ))}
      </section>

      <CustomerQuickActions
        customer={customer}
        siteUrl={siteUrl}
        onAction={showConfirm}
        onCopy={copyToClipboard}
        onNotify={() => changeTab("notifications")}
        onEmail={() => window.location.href = `mailto:${customer.owner.email}`}
      />

      <CustomerTabBar activeTab={activeTab} basePath={`/admin/customers/${customer.id}`} onChange={changeTab} />

      <div className="space-y-5">
        {activeTab === "overview" && <CustomerInfoPanel customer={customer} />}
        {activeTab === "overview" && <CustomerOverviewTab customer={customer} onTabChange={changeTab} />}

        {activeTab === "website" && <CustomerWebsiteTab customer={customer} onAction={showConfirm} />}
        {activeTab === "subscription" && <CustomerSubscriptionTab customer={customer} allSubscriptions={allSubscriptions} onAction={showConfirm} />}
        {activeTab === "payments" && <CustomerPaymentsTab customer={customer} />}
        {activeTab === "media" && <CustomerMediaTab media={media} searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
        {activeTab === "sessions" && <CustomerSessionsTab customer={customer} onAction={showConfirm} />}
        {activeTab === "notifications" && <CustomerNotificationsTab notifications={notifications} onSend={(type, title, body) => {
          const fd = new FormData()
          fd.set("tenantId", customer.id)
          fd.set("type", type)
          fd.set("title", title)
          fd.set("body", body)
          handleAction("send-notification", fd)
        }} />}
        {activeTab === "notes" && <CustomerNotesTab notes={adminNotes} onAddNote={(body) => {
          const fd = new FormData()
          fd.set("tenantId", customer.id)
          fd.set("body", body)
          handleAction("create-note", fd)
        }} onDeleteNote={(noteId) => {
          const fd = new FormData()
          fd.set("noteId", noteId)
          handleAction("delete-note", fd)
        }} />}
      </div>

      <AdminConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAndExecute}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        variant={confirmAction?.danger ? "danger" : "warning"}
        confirmLabel={confirmAction?.danger ? "تأكيد الحذف" : "تأكيد"}
        cancelLabel="إلغاء"
      />
    </div>
  )
}
