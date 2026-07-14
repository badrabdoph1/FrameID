"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Bell, CheckCircle2, ChevronLeft, ChevronRight, Clock3, PauseCircle, Settings2, Trash2 } from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { bulkCustomerLifecycleAction } from "@/app/(admin)/admin/customers/actions";

export type CustomerRow = {
  id: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  trialEndsAt: string | null;
  lifecycleEndAt: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
  latestPaymentStatus: string | null;
  isPublished: boolean;
  sitesCount: number;
  paymentsCount: number;
  createdAt: string;
};
const statusLabels: Record<string, string> = { ACTIVE: "نشط", TRIAL: "تجريبي", EXPIRED: "منتهي", TRIAL_EXPIRED: "انتهت التجربة", SUSPENDED: "موقوف", APPROVED: "مقبول", REJECTED: "مرفوض", SUBMITTED: "مرسل", PENDING: "معلق", UNDER_REVIEW: "قيد المراجعة" };

type Props = {
  data: CustomerRow[];
  page: number;
  totalPages: number;
  basePath: string;
  search: string;
  statusFilter: string;
  lifecycleFilter: string;
};

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  EXPIRED: "danger",
  TRIAL_EXPIRED: "danger",
  SUSPENDED: "danger",
};

const bulkActions = [
  { value: "extend-subscription", label: "تمديد الاشتراك", icon: Clock3 },
  { value: "extend-trial", label: "تمديد التجربة", icon: Clock3 },
  { value: "activate", label: "تفعيل", icon: CheckCircle2 },
  { value: "suspend", label: "تعطيل", icon: PauseCircle },
  { value: "archive", label: "أرشفة", icon: Archive },
  { value: "delete", label: "حذف", icon: Trash2 },
  { value: "notify", label: "إرسال إشعار", icon: Bell },
  { value: "email", label: "إرسال بريد", icon: Bell },
  { value: "change-duration", label: "تغيير مدة الاشتراك", icon: Settings2 },
];

function customerManageHref(id: string) { return `/admin/customers/${id}`; }

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG");
}

function daysLeft(value: string | null) {
  if (!value) return "دائم";
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "منتهي";
  return `متبقي ${days} يوم`;
}

export function CustomersTable({ data, page, totalPages, basePath, search, statusFilter, lifecycleFilter }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("extend-trial");
  const allSelected = data.length > 0 && data.every((row) => selected.has(row.id));
  const selectedRows = useMemo(() => data.filter((row) => selected.has(row.id)), [data, selected]);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(data.map((row) => row.id)));

  const buildPageLink = (p: number) => {
    const url = new URLSearchParams();
    if (search) url.set("search", search);
    if (statusFilter) url.set("status", statusFilter);
    if (lifecycleFilter && lifecycleFilter !== "all") url.set("filter", lifecycleFilter);
    if (p > 1) url.set("page", String(p));
    const qs = url.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <form
      action={bulkCustomerLifecycleAction}
      onSubmit={(event) => {
        if (selected.size === 0) {
          event.preventDefault();
          alert("اختر عميل واحد على الأقل.");
          return;
        }
        const label = bulkActions.find((item) => item.value === bulkAction)?.label ?? bulkAction;
        if (!confirm(`تأكيد تنفيذ عملية: ${label} على ${selected.size} عميل؟`)) event.preventDefault();
      }}
      className="space-y-4"
    >
      {[...selected].map((id) => <input key={id} type="hidden" name="tenantIds" value={id} />)}

      <section className={`rounded-2xl border p-4 ${selected.size ? "border-amber-300/18 bg-amber-300/[0.06]" : "border-white/8 bg-white/[0.025]"}`}>
        {!selected.size ? <div className="flex min-h-11 items-center gap-3"><CheckCircle2 className="size-5 text-white/25" /><div><h2 className="text-sm font-black text-white/65">العمليات الجماعية</h2><p className="mt-0.5 text-xs font-bold text-white/38">اختر عميلًا أو أكثر، وستظهر الإجراءات المناسبة هنا.</p></div></div> : <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end"><div><p className="text-xs font-black text-[#f3cf73]">العمليات الجماعية</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">{selected.size.toLocaleString("ar-EG")} عميل محدد</h2><p className="mt-1 text-xs font-bold text-white/45">اختر إجراءً واحدًا، ثم راجع رسالة التأكيد قبل التنفيذ.</p></div><div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-end"><label className="grid gap-1 text-xs font-black text-white/48">الإجراء<select aria-label="الإجراء الجماعي" name="bulkAction" value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="min-h-11 min-w-44 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-black text-white">{bulkActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>{bulkAction === "extend-trial" ? <label className="grid gap-1 text-xs font-black text-white/48">عدد الأيام<input aria-label="عدد الأيام" name="days" type="number" min={1} max={3650} defaultValue={30} className="min-h-11 w-32 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-black text-white" /></label> : null}{["extend-subscription", "change-duration", "activate"].includes(bulkAction) ? <label className="grid gap-1 text-xs font-black text-white/48">المدة<select aria-label="مدة الاشتراك" name="durationPreset" defaultValue="30" className="min-h-11 min-w-36 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-black text-white"><option value="30">٣٠ يومًا</option><option value="60">شهران</option><option value="90">٣ أشهر</option><option value="180">٦ أشهر</option><option value="365">سنة</option><option value="730">سنتان</option><option value="forever">دائم</option></select></label> : null}{["notify", "email"].includes(bulkAction) ? <label className="grid gap-1 text-xs font-black text-white/48">نص الرسالة<input aria-label="نص الرسالة" name="messageBody" className="min-h-11 min-w-64 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-black text-white" placeholder="اكتب الرسالة" /></label> : null}<button className="min-h-11 rounded-xl bg-[#f3cf73] px-5 text-xs font-black text-[#17120a]">تنفيذ الإجراء</button></div></div>}
      </section>

      <div role="list" aria-label="قائمة العملاء للموبايل" className="grid gap-3 md:hidden">
        {data.length === 0 ? <Empty /> : data.map((row) => <CustomerCard key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => toggle(row.id)} />)}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-right"><input aria-label="اختيار كل العملاء في الصفحة" type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">العميل</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الحالة</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الدورة</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">النشر</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الدفع</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">التاريخ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => <CustomerTableRow key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => toggle(row.id)} />)}
            {data.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-white/35">لا يوجد عملاء</td></tr> : null}
          </tbody>
        </table>
      </div>

      {selectedRows.length > 0 ? <p className="text-xs font-bold text-white/40">المحدد: {selectedRows.map((row) => row.displayName).slice(0, 4).join("، ")}{selectedRows.length > 4 ? "…" : ""}</p> : null}

      {totalPages > 1 && <div className="flex items-center justify-between"><p className="text-xs text-white/35">صفحة {page} من {totalPages}</p><div className="flex gap-2">{page > 1 && <Link href={buildPageLink(page - 1)} className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white/80"><ChevronRight className="size-3" /> السابق</Link>}{page < totalPages && <Link href={buildPageLink(page + 1)} className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white/80">التالي <ChevronLeft className="size-3" /></Link>}</div></div>}
    </form>
  );
}

function CustomerCard({ row, selected, onToggle }: { row: CustomerRow; selected: boolean; onToggle: () => void }) {
  return <article role="listitem" aria-label={row.displayName} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><input aria-label={`اختيار ${row.displayName}`} type="checkbox" checked={selected} onChange={onToggle} className="mt-1 size-5" /><div className="min-w-0"><h2 className="truncate text-base font-black text-[#fff7e8]">{row.displayName}</h2><p className="mt-1 truncate text-sm font-bold text-white/65">{row.ownerName}</p><p className="truncate text-xs font-bold text-white/38">{row.ownerEmail}</p></div></div><AdminStatusBadge tone={toneMap[row.status] || "neutral"}>{statusLabels[row.status] ?? row.status}</AdminStatusBadge></div><dl className="mt-4 grid grid-cols-2 gap-2"><Info label="الدورة" value={daysLeft(row.lifecycleEndAt)} /><Info label="الخطة" value={row.planName ?? "بدون خطة"} /><Info label="النشر" value={row.isPublished ? "منشور" : "غير منشور"} /><Info label="الدفع" value={row.latestPaymentStatus ? statusLabels[row.latestPaymentStatus] ?? row.latestPaymentStatus : "لا توجد مدفوعات"} /></dl><Link href={customerManageHref(row.id)} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-sm font-black text-[#f3cf73] no-underline"><Settings2 className="size-4" /> فتح ملف العميل</Link></article>;
}

function CustomerTableRow({ row, selected, onToggle }: { row: CustomerRow; selected: boolean; onToggle: () => void }) {
  return <tr className="border-b border-white/[0.06]"><td className="px-4 py-3"><input aria-label={`اختيار ${row.displayName} في الجدول`} type="checkbox" checked={selected} onChange={onToggle} /></td><td className="px-4 py-3"><Link href={customerManageHref(row.id)} className="font-medium text-white/80">{row.displayName}</Link><div className="text-xs text-white/40">{row.ownerEmail}</div></td><td className="px-4 py-3"><AdminStatusBadge tone={toneMap[row.status] || "neutral"}>{statusLabels[row.status] ?? row.status}</AdminStatusBadge></td><td className="px-4 py-3 text-white/60">{daysLeft(row.lifecycleEndAt)}</td><td className="px-4 py-3 text-white/60">{row.isPublished ? "منشور" : "غير منشور"}</td><td className="px-4 py-3 text-white/60">{row.latestPaymentStatus ? statusLabels[row.latestPaymentStatus] ?? row.latestPaymentStatus : "—"}</td><td className="px-4 py-3 text-white/60">{formatDate(row.createdAt)}</td><td className="px-4 py-3"><Link href={customerManageHref(row.id)} className="text-xs font-black text-[#f3cf73]">فتح الملف</Link></td></tr>;
}

function Info({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3"><dt className="text-[0.68rem] font-black text-white/35">{label}</dt><dd className="mt-1 text-sm font-bold text-white/70">{value}</dd></div>; }
function Empty() { return <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] px-4 py-10 text-center text-sm font-bold text-white/35">لا يوجد عملاء</div>; }
