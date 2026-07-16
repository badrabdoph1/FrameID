"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CalendarDays, CheckCircle2, Clock, DollarSign, ExternalLink, ImageIcon, X } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { StatCard } from "@/components/admin/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { approvePaymentAction, rejectPaymentAction, requestReuploadAction, addPaymentNoteAction, type PaymentActionResult } from "@/app/(admin)/admin/payments/actions";
import { getLifecycleEndDate, lifecycleDurationOptions, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";
import type { PaymentRequestFull } from "./page";

type Stats = {
  pendingCount: number;
  approvedThisMonth: number;
  totalRevenue: number;
  avgReviewHours: number | null;
};

type Props = {
  payments: PaymentRequestFull[];
  stats: Stats;
  banner: "approved" | "rejected" | "error" | "reupload" | "note-added" | null;
  initialTab?: TabId;
};

type TabId = "pending" | "all" | "completed" | "rejected";

type ApprovalState = {
  payment: PaymentRequestFull;
  durationPreset: LifecycleDurationPreset;
  customDays: number;
  adminNote: string;
};

type UiMessage = { ok: boolean; text: string } | null;

const tabs: { id: TabId; label: string }[] = [
  { id: "pending", label: "قيد المراجعة" },
  { id: "all", label: "كل الطلبات" },
  { id: "completed", label: "مكتملة" },
  { id: "rejected", label: "مرفوضة" },
];

const approvalDurationOptions = lifecycleDurationOptions.filter((option) => option.value !== "keep");

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  SUBMITTED: "warning",
  UNDER_REVIEW: "warning",
  REJECTED: "danger",
  DRAFT: "neutral",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REFUNDED: "neutral",
};

const statusLabel: Record<string, string> = {
  APPROVED: "مقبول",
  PENDING: "معلق",
  SUBMITTED: "قيد المراجعة",
  UNDER_REVIEW: "قيد المراجعة",
  REJECTED: "مرفوض",
  DRAFT: "مسودة",
  CANCELLED: "ملغي",
  EXPIRED: "منتهي",
  REFUNDED: "مسترجع",
};

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(amount: number, currency = "EGP") {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

function daysSince(value: Date | string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
}

function methodLabel(method: string) {
  if (method === "INSTAPAY") return "إنستا باي";
  if (method === "VODAFONE_CASH") return "فودافون كاش";
  if (method === "STRIPE") return "Stripe";
  if (method === "PAYPAL") return "PayPal";
  return method;
}

export function AdminPaymentsClient({ payments, stats, banner, initialTab = "pending" }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [approval, setApproval] = useState<ApprovalState | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [reuploadNote, setReuploadNote] = useState<Record<string, string>>({});
  const [internalNote, setInternalNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<UiMessage>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingPayments = useMemo(() => payments.filter((payment) => ["PENDING", "SUBMITTED", "UNDER_REVIEW"].includes(payment.status)), [payments]);
  const completedPayments = useMemo(() => payments.filter((payment) => payment.status === "APPROVED"), [payments]);
  const rejectedPayments = useMemo(() => payments.filter((payment) => payment.status === "REJECTED"), [payments]);
  const visiblePayments = activeTab === "pending" ? pendingPayments : activeTab === "completed" ? completedPayments : activeTab === "rejected" ? rejectedPayments : payments;
  const emptyMessage: Record<TabId, string> = {
    pending: "لا توجد طلبات دفع تنتظر المراجعة.",
    all: "لا توجد طلبات دفع حتى الآن.",
    completed: "لا توجد مدفوعات مكتملة بعد.",
    rejected: "لا توجد طلبات دفع مرفوضة.",
  };

  const bannerText = banner === "approved"
    ? { ok: true, text: "تم قبول الدفع وتفعيل الاشتراك بالمدة المحددة." }
    : banner === "rejected"
      ? { ok: true, text: "تم رفض طلب الدفع." }
      : banner === "reupload"
        ? { ok: true, text: "تم طلب إعادة رفع إثبات الدفع." }
        : banner === "note-added"
          ? { ok: true, text: "تم حفظ الملاحظة." }
          : banner === "error"
            ? { ok: false, text: "حدث خطأ أثناء تنفيذ العملية." }
            : null;
  const visibleMessage = message ?? bannerText;

  async function submitAction(action: (fd: FormData) => Promise<PaymentActionResult>, formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await action(formData);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) router.refresh();
      return result.ok;
    } catch {
      setMessage({ ok: false, text: "فشلت العملية بسبب خطأ غير متوقع. حاول مرة أخرى." });
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmApproval() {
    if (!approval) return;
    const formData = new FormData();
    formData.set("paymentRequestId", approval.payment.id);
    formData.set("durationPreset", approval.durationPreset);
    formData.set("customDays", String(approval.customDays));
    if (approval.adminNote.trim()) formData.set("adminNote", approval.adminNote.trim());
    const ok = await submitAction(approvePaymentAction, formData);
    if (ok) setApproval(null);
  }

  async function reject(payment: PaymentRequestFull) {
    const reason = rejectReason[payment.id]?.trim();
    if (!reason) { setMessage({ ok: false, text: "اكتب سبب الرفض أولًا." }); return; }
    const formData = new FormData();
    formData.set("paymentRequestId", payment.id);
    formData.set("adminNote", reason);
    await submitAction(rejectPaymentAction, formData);
  }

  async function requestReupload(payment: PaymentRequestFull) {
    const note = reuploadNote[payment.id]?.trim();
    if (!note) { setMessage({ ok: false, text: "اكتب ملاحظة إعادة الرفع أولًا." }); return; }
    const formData = new FormData();
    formData.set("paymentRequestId", payment.id);
    formData.set("note", note);
    await submitAction(requestReuploadAction, formData);
  }

  async function addNote(payment: PaymentRequestFull) {
    const note = internalNote[payment.id]?.trim();
    if (!note) { setMessage({ ok: false, text: "اكتب الملاحظة أولًا." }); return; }
    const formData = new FormData();
    formData.set("paymentRequestId", payment.id);
    formData.set("note", note);
    await submitAction(addPaymentNoteAction, formData);
  }

  return (
    <AdminPageShell badge="المال" title="مركز المدفوعات" description="مراجعة إثباتات الدفع وتحديد مدة الاشتراك قبل التفعيل.">
      {visibleMessage ? (
        <div className={cn("rounded-2xl border px-4 py-3 text-sm font-black", visibleMessage.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300")}>{visibleMessage.text}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="معلقة" value={stats.pendingCount} icon={Clock} iconColor="text-amber-400" accent />
        <StatCard label="مقبولة هذا الشهر" value={stats.approvedThisMonth} icon={CheckCircle2} iconColor="text-emerald-400" />
        <StatCard label="إجمالي الإيرادات" value={`${stats.totalRevenue.toLocaleString("ar-EG")} ج.م`} icon={DollarSign} iconColor="text-[#f3cf73]" accent />
        <StatCard label="متوسط المراجعة" value={stats.avgReviewHours != null ? `${stats.avgReviewHours} ساعة` : "—"} icon={Activity} iconColor="text-sky-400" />
      </section>

      <section className="rounded-3xl border border-amber-300/14 bg-amber-300/[0.045] p-4"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><CalendarDays className="size-5" /></span><div><h2 className="text-base font-black text-[#fff7e8]">قبول الدفع أصبح جزءًا من دورة حياة العميل</h2><p className="mt-1 text-sm font-bold leading-6 text-white/55">عند الضغط على قبول ستظهر نافذة اختيار مدة الاشتراك، وسيتم حفظ تاريخ البداية والانتهاء وتحديث حالة العميل وتسجيل العملية في سجل التدقيق.</p></div></div></section>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">{tabs.map((tab) => <button key={tab.id} aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={cn("min-h-10 flex-1 rounded-xl px-4 text-sm font-black transition", activeTab === tab.id ? "bg-[#f3cf73] text-[#17120a]" : "text-white/50 hover:bg-white/[0.06] hover:text-white")}>{tab.label}</button>)}</div>
      <section className="grid gap-3">{visiblePayments.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-12 text-center text-sm font-bold text-white/40">{emptyMessage[activeTab]}</div> : visiblePayments.map((payment) => <article key={payment.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"><header className="grid gap-3 border-b border-white/8 p-4 lg:grid-cols-[1fr_auto] lg:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-black text-[#fff7e8]">{payment.tenant.displayName}</h3><Badge tone={statusTone[payment.status] ?? "neutral"}>{statusLabel[payment.status] ?? payment.status}</Badge></div><p className="mt-1 text-xs font-bold text-white/42">{payment.tenant.owner.email} · {payment.plan?.name ?? "بدون خطة"} · {methodLabel(payment.method)} · منذ {daysSince(payment.createdAt)} يوم</p></div><strong className="text-lg font-black text-[#f3cf73]">{formatMoney(payment.amount, payment.currency)}</strong></header><div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.8fr]"><div className="grid gap-3 sm:grid-cols-2"><Info label="تاريخ الطلب" value={formatDate(payment.createdAt)} /><Info label="المرجع" value={payment.reference ?? "—"} /><Info label="المراجع" value={payment.logs?.[0]?.actorName ?? "—"} /></div><div className="grid gap-3">{payment.proofAsset ? <a href={payment.proofAsset.url} target="_blank" rel="noreferrer" className="flex min-h-24 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/18 p-3 text-white/70 no-underline transition hover:border-amber-300/24 hover:text-white"><span className="flex items-center gap-2 text-sm font-black"><ImageIcon className="size-4 text-[#f3cf73]" /> عرض إثبات الدفع</span><ExternalLink className="size-4" /></a> : <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm font-bold text-white/35">لا يوجد إثبات دفع</div>}</div></div>{pendingPayments.some((item) => item.id === payment.id) ? <footer className="grid gap-3 border-t border-white/8 p-4"><div className="flex flex-wrap gap-2"><button disabled={submitting} onClick={() => setApproval({ payment, durationPreset: "30", customDays: 30, adminNote: "" })} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] disabled:opacity-50"><CheckCircle2 className="size-4" /> قبول وتحديد المدة</button><TextActionInput value={rejectReason[payment.id] ?? ""} placeholder="سبب الرفض" onChange={(value) => setRejectReason((prev) => ({ ...prev, [payment.id]: value }))} buttonLabel="رفض" tone="danger" onSubmit={() => reject(payment)} disabled={submitting} /><TextActionInput value={reuploadNote[payment.id] ?? ""} placeholder="ملاحظة إعادة الرفع" onChange={(value) => setReuploadNote((prev) => ({ ...prev, [payment.id]: value }))} buttonLabel="إعادة رفع" tone="warning" onSubmit={() => requestReupload(payment)} disabled={submitting} /><TextActionInput value={internalNote[payment.id] ?? ""} placeholder="ملاحظة داخلية" onChange={(value) => setInternalNote((prev) => ({ ...prev, [payment.id]: value }))} buttonLabel="حفظ" tone="neutral" onSubmit={() => addNote(payment)} disabled={submitting} /></div></footer> : null}</article>)}</section>
      {approval ? <ApprovalModal approval={approval} setApproval={setApproval} onCancel={() => setApproval(null)} onConfirm={confirmApproval} submitting={submitting} /> : null}
    </AdminPageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/8 bg-black/14 p-3"><p className="text-[0.68rem] font-black text-white/35">{label}</p><p className="mt-1 truncate text-sm font-bold text-white/72">{value}</p></div>; }
function TextActionInput({ value, placeholder, buttonLabel, tone, onChange, onSubmit, disabled }: { value: string; placeholder: string; buttonLabel: string; tone: "danger" | "warning" | "neutral"; onChange: (value: string) => void; onSubmit: () => void; disabled?: boolean }) { const buttonClass = tone === "danger" ? "border-red-400/24 text-red-300 hover:bg-red-500/10" : tone === "warning" ? "border-amber-400/24 text-amber-300 hover:bg-amber-500/10" : "border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white"; return <span className="inline-flex min-h-11 overflow-hidden rounded-2xl border border-white/8 bg-black/16"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-36 bg-transparent px-3 text-xs font-bold text-white outline-none placeholder:text-white/25" /><button disabled={disabled || !value.trim()} onClick={onSubmit} className={cn("border-r px-3 text-xs font-black transition disabled:opacity-35", buttonClass)}>{buttonLabel}</button></span>; }
function ApprovalModal({ approval, setApproval, onCancel, onConfirm, submitting }: { approval: ApprovalState; setApproval: (value: ApprovalState) => void; onCancel: () => void; onConfirm: () => void; submitting: boolean }) { const expectedEnd = getLifecycleEndDate(new Date(), approval.durationPreset, approval.customDays); return <div className="fixed inset-0 z-[2147483000] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-300/18 bg-[#111720] text-[#fff7e8] shadow-2xl"><header className="flex items-start justify-between gap-3 border-b border-white/10 bg-amber-300/[0.06] p-5"><div><p className="text-xs font-black text-[#f3cf73]">تأكيد تفعيل الاشتراك</p><h2 className="mt-1 text-xl font-black">اختر مدة الاشتراك قبل قبول الدفع</h2><p className="mt-1 text-sm font-bold text-white/48">العميل: {approval.payment.tenant.displayName}</p></div><button onClick={onCancel} className="grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60"><X className="size-4" /></button></header><div className="grid gap-4 p-5"><div className="grid gap-2 sm:grid-cols-2">{approvalDurationOptions.map((option) => <label key={option.value} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 text-sm font-black transition", approval.durationPreset === option.value ? "border-amber-300/45 bg-amber-300/12 text-[#f3cf73]" : "border-white/10 bg-white/[0.035] text-white/58 hover:border-amber-300/18")}><input type="radio" name="duration" checked={approval.durationPreset === option.value} onChange={() => setApproval({ ...approval, durationPreset: option.value })} />{option.label}</label>)}</div>{approval.durationPreset === "custom" ? <label className="grid gap-1.5"><span className="text-xs font-black text-white/42">المدة المخصصة بالأيام</span><input type="number" min={1} max={3650} value={approval.customDays} onChange={(event) => setApproval({ ...approval, customDays: Number(event.target.value) || 30 })} className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-sm font-black text-white outline-none focus:border-amber-300/45" /></label> : null}<div className="rounded-2xl border border-white/10 bg-black/18 p-4"><p className="text-xs font-black text-white/38">تاريخ الانتهاء المتوقع</p><p className="mt-1 text-lg font-black text-[#f3cf73]">{expectedEnd ? formatDate(expectedEnd) : "اشتراك دائم بدون تاريخ انتهاء"}</p></div><label className="grid gap-1.5"><span className="text-xs font-black text-white/42">ملاحظة داخلية اختيارية</span><textarea rows={3} value={approval.adminNote} onChange={(event) => setApproval({ ...approval, adminNote: event.target.value })} className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-300/45" /></label></div><footer className="grid gap-2 border-t border-white/10 p-5 sm:grid-cols-2"><button onClick={onCancel} className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/62">إلغاء</button><button disabled={submitting} onClick={onConfirm} className="min-h-12 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-black text-[#17120a] disabled:opacity-50">تأكيد التفعيل</button></footer></section></div>; }
