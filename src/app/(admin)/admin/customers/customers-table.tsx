"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Bell, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, PauseCircle, Settings2, Trash2, Users } from "lucide-react";
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

function customerWorkspaceHref(id: string) { return `/admin/customers/${id}/workspace`; }
function customerLegacyHref(id: string) { return `/admin/customers/${id}`; }

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
  const [bulkAction, setBulkAction] = useState("extend-subscription");
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

      <section className="rounded-3xl border border-amber-300/14 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.10),transparent_36%),rgba(255,255,255,0.035)] p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-xs font-black text-[#f3cf73]">العمليات الجماعية</p>
            <h2 className="mt-1 text-lg font-black text-[#fff7e8]">{selected.size > 0 ? `${selected.size.toLocaleString("ar-EG")} عميل محدد` : "حدد عملاء لتنفيذ إجراء"}</h2>
            <p className="mt-1 text-xs font-bold text-white/45">يمكنك تمديد التجربة أو الاشتراك، تفعيل، تعطيل، أرشفة، إرسال إشعار أو طلب بريد.</p>
          </div>
          <div className="grid gap-2 md:grid-cols-[180px_110px_160px_110px_1fr_auto]">
            <select name="bulkAction" value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-xs font-black text-white outline-none">
              {bulkActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
            </select>
            <input name="days" type="number" min={1} max={3650} defaultValue={30} className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-xs font-black text-white outline-none" placeholder="أيام" />
            <select name="durationPreset" defaultValue="30" className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-xs font-black text-white outline-none">
              <option value="30">30 يوم</option><option value="60">شهرين</option><option value="90">3 أشهر</option><option value="180">6 أشهر</option><option value="365">سنة</option><option value="730">سنتين</option><option value="forever">دائم</option><option value="custom">مخصص</option>
            </select>
            <input name="customDays" type="number" min={1} max={3650} defaultValue={30} className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-xs font-black text-white outline-none" placeholder="مخصص" />
            <input name="messageBody" className="min-h-11 rounded-2xl border border-white/10 bg-black/18 px-3 text-xs font-black text-white outline-none" placeholder="نص إشعار/بريد اختياري" />
            <button className="min-h-11 rounded-2xl bg-[#f3cf73] px-4 text-xs font-black text-[#17120a]">تنفيذ</button>
          </div>
        </div>
      </section>

      <div role="list" aria-label="قائمة العملاء للموبايل" className="grid gap-3 md:hidden">
        {data.length === 0 ? <Empty /> : data.map((row) => <CustomerCard key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => toggle(row.id)} />)}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-right"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
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
  return <article className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"><div className="flex items-start justify-between gap-3"><label className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={selected} onChange={onToggle} className="mt-1" /><span className="min-w-0"><h2 className="truncate text-base font-black text-[#fff7e8]">{row.displayName}</h2><p className="mt-1 truncate text-sm font-bold text-white/65">{row.ownerName}</p><p className="truncate text-xs font-bold text-white/38">{row.ownerEmail}</p></span></label><AdminStatusBadge tone={toneMap[row.status] || "neutral"}>{row.status}</AdminStatusBadge></div><dl className="mt-4 grid grid-cols-2 gap-2"><Info label="الدورة" value={daysLeft(row.lifecycleEndAt)} /><Info label="الخطة" value={row.planName ?? "—"} /><Info label="النشر" value={row.isPublished ? "منشور" : "غير منشور"} /><Info label="الدفع" value={row.latestPaymentStatus ?? "—"} /></dl><div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><Link href={customerWorkspaceHref(row.id)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-sm font-black text-[#f3cf73] no-underline transition hover:bg-amber-500/15"><Settings2 className="size-4" /> إدارة العميل</Link><Link href={customerLegacyHref(row.id)} className="grid min-h-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-white/45 no-underline transition hover:bg-white/[0.08] hover:text-white/70" aria-label="فتح التفاصيل"><ExternalLink className="size-4" /></Link></div></article>;
}

function CustomerTableRow({ row, selected, onToggle }: { row: CustomerRow; selected: boolean; onToggle: () => void }) {
  return <tr className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]"><td className="px-4 py-3"><input type="checkbox" checked={selected} onChange={onToggle} /></td><td className="px-4 py-3"><Link href={customerWorkspaceHref(row.id)} className="font-medium text-white/80 no-underline hover:text-[#f3cf73]">{row.displayName}</Link><div className="text-xs text-white/40">{row.ownerEmail}</div></td><td className="px-4 py-3"><AdminStatusBadge tone={toneMap[row.status] || "neutral"}>{row.status}</AdminStatusBadge></td><td className="px-4 py-3 text-white/60"><div>{daysLeft(row.lifecycleEndAt)}</div><div className="text-xs text-white/35">{row.planName ?? row.subscriptionStatus ?? "—"}</div></td><td className="px-4 py-3 text-white/60">{row.isPublished ? "منشور" : "غير منشور"}</td><td className="px-4 py-3 text-white/60">{row.latestPaymentStatus ?? "—"}</td><td className="px-4 py-3 text-white/60">{formatDate(row.createdAt)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Link href={customerWorkspaceHref(row.id)} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-[#f3cf73] no-underline transition hover:bg-amber-500/15"><Settings2 className="size-3" /> إدارة</Link><Link href={customerLegacyHref(row.id)} className="flex items-center gap-1 text-xs text-white/35 transition hover:text-champagne">تفاصيل <ExternalLink className="size-3" /></Link></div></td></tr>;
}

function Info({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3"><dt className="text-[0.68rem] font-black text-white/35">{label}</dt><dd className="mt-1 text-sm font-bold text-white/70">{value}</dd></div>; }
function Empty() { return <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] px-4 py-10 text-center text-sm font-bold text-white/35">لا يوجد عملاء</div>; }
