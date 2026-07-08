"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  ImageIcon,
  Download,
  User,
  Mail,
  Globe,
  Calendar,
  Hash,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { AdminPageShell } from "@/components/layout/admin-page-shell"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog"
import { AdminActivityTimeline } from "@/components/layout/admin-activity-timeline"
import { StatCard } from "@/components/admin/shared/stat-card"
import { DataTable, type Column } from "@/components/admin/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { PaymentProofLightbox } from "@/components/admin/payment-proof-lightbox"
import {
  approvePaymentAction,
  rejectPaymentAction,
  requestReuploadAction,
  addPaymentNoteAction,
} from "@/app/(admin)/admin/payments/actions"
import type { PaymentRequestFull } from "./page"

type Stats = {
  pendingCount: number
  approvedThisMonth: number
  totalRevenue: number
  avgReviewHours: number | null
}

type Props = {
  payments: PaymentRequestFull[]
  stats: Stats
  banner: "approved" | "rejected" | "error" | "reupload" | "note-added" | null
}

type TabId = "pending" | "all" | "completed" | "rejected"

type ConfirmAction = {
  type: "approve" | "reject" | "reupload" | "add-note"
  paymentId: string
  title: string
  description: string
}

const tabs: { id: TabId; label: string }[] = [
  { id: "pending", label: "قيد المراجعة" },
  { id: "all", label: "كل الطلبات" },
  { id: "completed", label: "مكتملة" },
  { id: "rejected", label: "مرفوضة" },
]

const statusBadgeMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  DRAFT: "neutral",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REFUNDED: "neutral",
}

const statusLabelMap: Record<string, string> = {
  APPROVED: "مقبول",
  PENDING: "معلق",
  REJECTED: "مرفوض",
  DRAFT: "مسودة",
  SUBMITTED: "قيد المراجعة",
  UNDER_REVIEW: "قيد المراجعة",
  CANCELLED: "ملغي",
  EXPIRED: "منتهي",
  REFUNDED: "مسترجع",
}

function formatMethod(method: string): string {
  switch (method) {
    case "INSTAPAY": return "إنستا باي"
    case "VODAFONE_CASH": return "فودافون كاش"
    case "STRIPE": return "Stripe"
    case "PAYPAL": return "PayPal"
    default: return method
  }
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function daysSince(d: Date | string): number {
  const diff = Date.now() - new Date(d).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AdminPaymentsClient({ payments, stats, banner }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("pending")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [confirmExtra, setConfirmExtra] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxMeta, setLightboxMeta] = useState<{
    sizeBytes?: number | null
    width?: number | null
    height?: number | null
    mimeType?: string | null
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [reuploadNotes, setReuploadNotes] = useState<Record<string, string>>({})
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({})

  const showMsg = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  const handleServerAction = useCallback(
    async (action: (fd: FormData) => Promise<void>, formData: FormData) => {
      setSubmitting(true)
      try {
        await action(formData)
        showMsg("success", "تمت العملية بنجاح")
        router.refresh()
      } catch {
        showMsg("error", "فشلت العملية")
      } finally {
        setSubmitting(false)
      }
    },
    [router, showMsg],
  )

  const openConfirm = useCallback(
    (type: ConfirmAction["type"], paymentId: string, title: string, description: string) => {
      setConfirmAction({ type, paymentId, title, description })
      setConfirmExtra("")
    },
    [],
  )

  const executeConfirm = useCallback(async () => {
    if (!confirmAction) return
    const { type, paymentId } = confirmAction
    const fd = new FormData()
    fd.set("paymentRequestId", paymentId)

    if (type === "reject") {
      const reason = rejectReasons[paymentId]
      if (!reason?.trim()) return
      fd.set("adminNote", reason.trim())
      await handleServerAction(rejectPaymentAction, fd)
    } else if (type === "approve") {
      if (confirmExtra.trim()) fd.set("adminNote", confirmExtra.trim())
      await handleServerAction(approvePaymentAction, fd)
    } else if (type === "reupload") {
      const note = reuploadNotes[paymentId]
      if (!note?.trim()) return
      fd.set("note", note.trim())
      await handleServerAction(requestReuploadAction, fd)
    } else if (type === "add-note") {
      const note = noteTexts[paymentId]
      if (!note?.trim()) return
      fd.set("note", note.trim())
      await handleServerAction(addPaymentNoteAction, fd)
    }

    setConfirmAction(null)
    setConfirmExtra("")
  }, [confirmAction, rejectReasons, reuploadNotes, noteTexts, confirmExtra, handleServerAction])

  const openLightbox = useCallback(
    (url: string, asset: PaymentRequestFull["proofAsset"]) => {
      setLightboxUrl(url)
      setLightboxMeta(asset
        ? {
            sizeBytes: asset.sizeBytes,
            width: asset.width,
            height: asset.height,
            mimeType: asset.mimeType,
          }
        : null)
    },
    [],
  )

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === "PENDING" || p.status === "SUBMITTED" || p.status === "UNDER_REVIEW"),
    [payments],
  )

  const completedPayments = useMemo(
    () => payments.filter((p) => p.status === "APPROVED"),
    [payments],
  )

  const rejectedPayments = useMemo(
    () => payments.filter((p) => p.status === "REJECTED"),
    [payments],
  )

  const allTableData = useMemo(
    () =>
      payments.map((p) => ({
        id: p.id,
        tenantId: p.tenant.id,
        customerName: p.tenant.displayName,
        planName: p.plan?.name ?? "—",
        amount: p.amount,
        currency: p.currency,
        method: formatMethod(p.method),
        status: p.status,
        statusLabel: statusLabelMap[p.status] ?? p.status,
        createdAt: p.createdAt,
        reviewerName: p.reviewedBy?.name ?? null,
      })),
    [payments],
  )

  const allColumns: Column<(typeof allTableData)[number]>[] = [
    {
      key: "customerName",
      header: "العميل",
      searchable: true,
      render: (r) => (
        <a
          href={`/admin/customers/${r.tenantId}`}
          className="text-white/80 no-underline transition hover:text-amber-400"
          onClick={(e) => e.stopPropagation()}
        >
          {r.customerName}
        </a>
      ),
    },
    { key: "planName", header: "الباقة" },
    {
      key: "amount",
      header: "المبلغ",
      render: (r) => `${r.amount.toLocaleString("ar-EG")} ${r.currency}`,
    },
    { key: "method", header: "طريقة الدفع" },
    {
      key: "status",
      header: "الحالة",
      render: (r) => (
        <Badge tone={statusBadgeMap[r.status] || "neutral"}>{r.statusLabel}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "التاريخ",
      sortable: true,
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: "reviewerName",
      header: "المراجع",
      render: (r) => r.reviewerName ?? "—",
    },
  ]

  const completedColumns: Column<(typeof allTableData)[number]>[] = allColumns.filter(
    (c) => c.key !== "status",
  )
  completedColumns.splice(4, 0, {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={statusBadgeMap[r.status] || "neutral"}>{r.statusLabel}</Badge>
    ),
  })

  const bannerMap = {
    approved: {
      tone: "success" as const,
      text: "تم قبول الدفع وتفعيل الاشتراك بنجاح",
    },
    rejected: {
      tone: "warning" as const,
      text: "تم رفض طلب الدفع",
    },
    "note-added": {
      tone: "info" as const,
      text: "تم إضافة الملاحظة بنجاح",
    },
    reupload: {
      tone: "info" as const,
      text: "تم طلب إعادة رفع الإثبات",
    },
    error: {
      tone: "danger" as const,
      text: "حدث خطأ أثناء تنفيذ العملية",
    },
  } as const
  const bannerConfig = banner ? bannerMap[banner] : null

  return (
    <AdminPageShell
      badge="الإدارة"
      title="مركز المدفوعات"
      description="مراجعة وإدارة جميع طلبات الدفع والاشتراكات"
    >
      {message && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-extrabold",
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400",
          )}
        >
          {message.text}
        </div>
      )}

      {bannerConfig && !message && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-extrabold",
            bannerConfig.tone === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
            bannerConfig.tone === "warning" && "border-amber-500/20 bg-amber-500/10 text-amber-400",
            bannerConfig.tone === "danger" && "border-red-500/20 bg-red-500/10 text-red-400",
            bannerConfig.tone === "info" && "border-sky-500/20 bg-sky-500/10 text-sky-400",
          )}
        >
          {bannerConfig.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="معلقة"
          value={stats.pendingCount}
          icon={Clock}
          iconColor="text-amber-400"
          accent
        />
        <StatCard
          label="مقبولة هذا الشهر"
          value={stats.approvedThisMonth}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString("ar-EG")} ج.م`}
          icon={DollarSign}
          iconColor="text-[#f3cf73]"
          accent
        />
        <StatCard
          label="متوسط وقت المراجعة"
          value={stats.avgReviewHours != null ? `${stats.avgReviewHours} ساعة` : "—"}
          icon={Activity}
          iconColor="text-sky-400"
        />
      </div>

      <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-extrabold transition",
              activeTab === tab.id
                ? "bg-[#f3cf73] text-[#17120a] shadow-lg"
                : "text-white/50 hover:bg-white/6 hover:text-white/80",
            )}
          >
            {tab.label}
            {tab.id === "pending" && pendingPayments.length > 0 && (
              <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-extrabold text-amber-400">
                {pendingPayments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/3 px-6 py-16 text-center">
              <ShieldCheck size={40} className="mb-4 text-emerald-400/60" />
              <p className="text-lg font-semibold text-white/60">جميع المدفوعات تمت مراجعتها</p>
              <p className="mt-1 text-sm text-white/40">لا توجد طلبات دفع معلقة للمراجعة</p>
            </div>
          ) : (
            pendingPayments.map((p) => {
              const isExpanded = expandedId === p.id
              return (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <DollarSign size={18} className="text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {p.tenant.displayName}
                        </p>
                        <p className="text-xs text-white/40">
                          {p.amount.toLocaleString("ar-EG")} {p.currency} · {formatMethod(p.method)}
                          {p.plan && ` · ${p.plan.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <AdminStatusBadge tone="warning">في الانتظار</AdminStatusBadge>
                      <span className="text-xs text-amber-400/60">
                        {daysSince(p.createdAt)} يوم
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/6 hover:text-white/70"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/6">
                      <div className="grid gap-6 p-4 md:grid-cols-3">
                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-xs font-extrabold text-white/40">
                            <User size={14} />
                            معلومات العميل
                          </h4>
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <User size={14} className="shrink-0 text-white/30" />
                              <span className="text-white/80">{p.tenant.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail size={14} className="shrink-0 text-white/30" />
                              <a
                                href={`mailto:${p.tenant.owner.email}`}
                                className="text-white/60 no-underline transition hover:text-amber-400"
                              >
                                {p.tenant.owner.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Globe size={14} className="shrink-0 text-white/30" />
                              <a
                                href={`/admin/customers/${p.tenant.id}`}
                                className="flex items-center gap-1 text-white/60 no-underline transition hover:text-amber-400"
                              >
                                عرض صفحة العميل
                                <ExternalLink size={12} />
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={14} className="shrink-0 text-white/30" />
                              <span className="text-white/50">
                                تاريخ التسجيل: {formatDate(p.tenant.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-xs font-extrabold text-white/40">
                            <Receipt size={14} />
                            تفاصيل الطلب
                          </h4>
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <Hash size={14} className="shrink-0 text-white/30" />
                              <span className="font-mono text-xs text-white/50" dir="ltr">
                                {p.id.slice(0, 12)}...
                              </span>
                            </div>
                            {p.plan && (
                              <div className="flex items-center gap-2 text-sm">
                                <CreditCard size={14} className="shrink-0 text-white/30" />
                                <span className="text-white/80">
                                  {p.plan.name} — {p.plan.priceAmount.toLocaleString("ar-EG")} {p.currency}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard size={14} className="shrink-0 text-white/30" />
                              <span className="text-white/60">{formatMethod(p.method)}</span>
                            </div>
                            {p.paymentAccount && (
                              <div className="rounded-lg border border-white/6 bg-white/3 p-3">
                                <p className="text-xs font-extrabold text-white/40">بيانات الحساب</p>
                                <p className="mt-1 text-sm text-white/80">{p.paymentAccount.accountName}</p>
                                <p className="text-xs text-white/50" dir="ltr">{p.paymentAccount.accountNumber}</p>
                                {p.paymentAccount.bankName && (
                                  <p className="text-xs text-white/40">{p.paymentAccount.bankName}</p>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign size={14} className="shrink-0 text-white/30" />
                              <span className="font-semibold text-white">
                                {p.amount.toLocaleString("ar-EG")} {p.currency}
                              </span>
                            </div>
                            {p.reference && (
                              <div className="flex items-center gap-2 text-sm">
                                <Hash size={14} className="shrink-0 text-white/30" />
                                <span className="font-mono text-xs text-white/50" dir="ltr">
                                  المرجع: {p.reference}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar size={14} className="shrink-0 text-white/30" />
                              <span className="text-white/50">{formatDateTime(p.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-xs font-extrabold text-white/40">
                            <ImageIcon size={14} />
                            إثبات الدفع
                          </h4>
                          {p.proofAsset ? (
                            <div className="space-y-3">
                              <button
                                onClick={() => openLightbox(p.proofAsset!.url, p.proofAsset)}
                                className="group relative w-full overflow-hidden rounded-lg border border-white/8 bg-white/3"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.proofAsset.url}
                                  alt="إثبات الدفع"
                                  className="h-40 w-full object-cover transition group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                                  <ArrowUpRight size={24} className="text-white" />
                                </div>
                              </button>
                              <div className="flex items-center justify-between text-xs text-white/40">
                                <div className="flex items-center gap-2">
                                  <span>{formatBytes(p.proofAsset.sizeBytes)}</span>
                                  {p.proofAsset.width && p.proofAsset.height && (
                                    <span>
                                      {p.proofAsset.width}×{p.proofAsset.height}
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={p.proofAsset.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-amber-400/70 no-underline transition hover:text-amber-400"
                                >
                                  <Download size={12} />
                                  تحميل
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/8 py-8">
                              <ImageIcon size={24} className="mb-2 text-white/20" />
                              <p className="text-xs text-white/30">لا يوجد إثبات دفع</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-white/6 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() =>
                              openConfirm(
                                "approve",
                                p.id,
                                "قبول طلب الدفع",
                                "سيتم تأكيد الدفع وتفعيل الاشتراك للعميل. هل أنت متأكد؟",
                              )
                            }
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 py-2.5 text-sm font-extrabold text-[#17120a] shadow-lg transition hover:opacity-90 disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} />
                            قبول
                          </button>

                          <div className="relative">
                            <input
                              value={rejectReasons[p.id] ?? ""}
                              onChange={(e) =>
                                setRejectReasons((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              placeholder="سبب الرفض *"
                              className="h-10 w-44 rounded-lg border border-white/8 bg-white/3 px-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-red-500/40"
                            />
                            <button
                              onClick={() => {
                                const reason = rejectReasons[p.id]
                                if (!reason?.trim()) {
                                  showMsg("error", "يرجى كتابة سبب الرفض")
                                  return
                                }
                                openConfirm(
                                  "reject",
                                  p.id,
                                  "رفض طلب الدفع",
                                  `سيتم رفض طلب الدفع مع إشعار العميل. السبب: ${reason.trim()}`,
                                )
                              }}
                              disabled={submitting || !rejectReasons[p.id]?.trim()}
                              className="mr-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-extrabold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                            >
                              <XCircle size={16} />
                              رفض
                            </button>
                          </div>

                          <div className="relative mr-auto">
                            <input
                              value={reuploadNotes[p.id] ?? ""}
                              onChange={(e) =>
                                setReuploadNotes((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              placeholder="ملاحظة إعادة الرفع *"
                              className="h-10 w-44 rounded-lg border border-white/8 bg-white/3 px-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-amber-500/40"
                            />
                            <button
                              onClick={() => {
                                const note = reuploadNotes[p.id]
                                if (!note?.trim()) {
                                  showMsg("error", "يرجى كتابة ملاحظة لإعادة الرفع")
                                  return
                                }
                                openConfirm(
                                  "reupload",
                                  p.id,
                                  "طلب إعادة رفع الإثبات",
                                  `سيتم إخطار العميل بإعادة رفع إثبات الدفع. الملاحظة: ${note.trim()}`,
                                )
                              }}
                              disabled={submitting || !reuploadNotes[p.id]?.trim()}
                              className="mr-2 inline-flex items-center gap-2 rounded-lg border border-amber-500/20 px-4 py-2.5 text-sm font-extrabold text-amber-400/80 transition hover:bg-amber-500/8 disabled:opacity-40"
                            >
                              <FileText size={16} />
                              طلب إعادة رفع
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              value={noteTexts[p.id] ?? ""}
                              onChange={(e) =>
                                setNoteTexts((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              placeholder="ملاحظة داخلية"
                              className="h-10 w-40 rounded-lg border border-white/8 bg-white/3 px-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-sky-500/40"
                            />
                            <button
                              onClick={() => {
                                const note = noteTexts[p.id]
                                if (!note?.trim()) {
                                  showMsg("error", "يرجى كتابة الملاحظة")
                                  return
                                }
                                openConfirm(
                                  "add-note",
                                  p.id,
                                  "إضافة ملاحظة داخلية",
                                  note.trim(),
                                )
                              }}
                              disabled={submitting || !noteTexts[p.id]?.trim()}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2.5 text-xs font-extrabold text-white/50 transition hover:bg-white/6 hover:text-white/80 disabled:opacity-40"
                            >
                              <FileText size={14} />
                              إضافة ملاحظة
                            </button>
                          </div>
                        </div>
                      </div>

                      {p.logs.length > 0 && (
                        <div className="border-t border-white/6 p-4">
                          <h4 className="mb-4 flex items-center gap-2 text-xs font-extrabold text-white/40">
                            <Activity size={14} />
                            سجل النشاط
                          </h4>
                          <AdminActivityTimeline
                            events={[...p.logs].reverse().map((log) => ({
                              id: log.id,
                              action:
                                log.action === "APPROVED"
                                  ? "تم القبول"
                                  : log.action === "REJECTED"
                                    ? "تم الرفض"
                                    : log.action === "REUPLOAD_REQUESTED"
                                      ? "طلب إعادة رفع"
                                      : log.action === "NOTE_ADDED"
                                        ? "ملاحظة داخلية"
                                        : log.action === "SUBMITTED"
                                          ? "تم الإرسال"
                                          : log.action,
                              description: log.note ?? "",
                              timestamp: log.createdAt.toISOString(),
                              actor: log.actorName ?? undefined,
                              type:
                                log.action === "APPROVED"
                                  ? ("success" as const)
                                  : log.action === "REJECTED"
                                    ? ("danger" as const)
                                    : log.action === "REUPLOAD_REQUESTED"
                                      ? ("warning" as const)
                                      : ("default" as const),
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === "all" && (
        <DataTable
          columns={allColumns}
          data={allTableData}
          keyField="id"
          pageSize={15}
        />
      )}

      {activeTab === "completed" && (
        <DataTable
          columns={completedColumns}
          data={completedPayments.map((p) => ({
            id: p.id,
            tenantId: p.tenant.id,
            customerName: p.tenant.displayName,
            planName: p.plan?.name ?? "—",
            amount: p.amount,
            currency: p.currency,
            method: formatMethod(p.method),
            status: p.status,
            statusLabel: statusLabelMap[p.status] ?? p.status,
            createdAt: p.createdAt,
            reviewerName: p.reviewedBy?.name ?? null,
          }))}
          keyField="id"
          pageSize={15}
        />
      )}

      {activeTab === "rejected" && (
        <DataTable
          columns={completedColumns}
          data={rejectedPayments.map((p) => ({
            id: p.id,
            tenantId: p.tenant.id,
            customerName: p.tenant.displayName,
            planName: p.plan?.name ?? "—",
            amount: p.amount,
            currency: p.currency,
            method: formatMethod(p.method),
            status: p.status,
            statusLabel: statusLabelMap[p.status] ?? p.status,
            createdAt: p.createdAt,
            reviewerName: p.reviewedBy?.name ?? null,
          }))}
          keyField="id"
          pageSize={15}
        />
      )}

      <AdminConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirm}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        variant={
          confirmAction?.type === "approve" || confirmAction?.type === "add-note"
            ? "warning"
            : "danger"
        }
        confirmLabel={
          confirmAction?.type === "approve"
            ? "قبول"
            : confirmAction?.type === "reject"
              ? "رفض"
              : confirmAction?.type === "reupload"
                ? "طلب إعادة رفع"
                : "إضافة ملاحظة"
        }
        cancelLabel="إلغاء"
        loading={submitting}
      />

      <PaymentProofLightbox
        open={!!lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        imageUrl={lightboxUrl ?? ""}
        metadata={lightboxMeta}
      />
    </AdminPageShell>
  )
}
