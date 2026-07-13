import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, Filter, Search, ShieldCheck, XCircle } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { cn } from "@/lib/utils/cn";
import type {
  CustomerIssueListFilters,
  CustomerIssueListResult,
  CustomerIssueListRow,
  CustomerIssueStats,
} from "@/modules/customer-issues/admin-queries";
import type { CustomerIssuePriority, CustomerIssueStatus } from "@/modules/customer-issues/types";

const statusLabels: Record<CustomerIssueStatus, string> = {
  NEW: "جديد",
  IN_REVIEW: "قيد المراجعة",
  RESOLVED: "محلول",
  CLOSED: "مغلق",
};

const priorityLabels: Record<CustomerIssuePriority, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  CRITICAL: "حرجة",
};

const priorityClasses: Record<CustomerIssuePriority, string> = {
  LOW: "border-white/10 bg-white/5 text-white/55",
  MEDIUM: "border-blue-300/20 bg-blue-400/10 text-blue-200",
  HIGH: "border-amber-300/24 bg-amber-300/10 text-amber-200",
  CRITICAL: "border-red-300/24 bg-red-400/10 text-red-200",
};

const statusClasses: Record<CustomerIssueStatus, string> = {
  NEW: "border-red-300/22 bg-red-400/10 text-red-100",
  IN_REVIEW: "border-amber-300/24 bg-amber-300/10 text-amber-100",
  RESOLVED: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  CLOSED: "border-white/10 bg-white/5 text-white/55",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function metricCards(stats: CustomerIssueStats) {
  return [
    { label: "بلاغات جديدة", shortLabel: "جديدة", value: stats.new, icon: AlertCircle, tone: "text-red-200", bg: "bg-red-400/10 border-red-300/18" },
    { label: "قيد المراجعة", shortLabel: "قيد المراجعة", value: stats.inReview, icon: Clock3, tone: "text-amber-200", bg: "bg-amber-300/10 border-amber-300/18" },
    { label: "محلولة", shortLabel: "محلولة", value: stats.resolved, icon: CheckCircle2, tone: "text-emerald-200", bg: "bg-emerald-400/10 border-emerald-300/18" },
    { label: "مغلقة", shortLabel: "مغلقة", value: stats.closed, icon: XCircle, tone: "text-white/65", bg: "bg-white/5 border-white/10" },
  ];
}

function metricHref(label: string): string {
  if (label === "بلاغات جديدة") return "/admin/errors?status=NEW";
  if (label === "قيد المراجعة") return "/admin/errors?status=IN_REVIEW";
  if (label === "محلولة") return "/admin/errors?status=RESOLVED";
  return "/admin/errors?status=CLOSED";
}

function issueHref(row: CustomerIssueListRow): string {
  return `/admin/errors/${row.id}`;
}

export function CustomerIssueCenterView({
  stats,
  result,
  filters,
}: {
  stats: CustomerIssueStats;
  result: CustomerIssueListResult;
  filters: CustomerIssueListFilters;
}) {
  const cards = metricCards(stats);
  return (
    <AdminPageShell
      badge="مهم"
      title="مشاكل العملاء"
      description="بلاغات العملاء تظهر هنا فورًا مع السياق التقني الكامل محفوظًا للإدارة فقط."
      actions={[{ label: `${stats.new} بلاغ جديد`, href: "/admin/errors?status=NEW", variant: stats.new > 0 ? "danger" : "secondary", icon: AlertCircle }]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={metricHref(card.label)} className={cn("rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5 hover:bg-white/8", card.bg)}>
              <div className="flex items-center justify-between gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl bg-black/20", card.tone)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-2xl font-black text-[#fff7e8]">{card.value}</span>
              </div>
              <p className="mt-3 text-sm font-black text-white/75">{card.shortLabel}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-amber-300/14 bg-amber-300/[0.06] px-4 py-3 text-sm font-black text-amber-100">
        {stats.unreportedOccurrences} ظهور تقني بلا بلاغ
      </section>

      <form action="/admin/errors" className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">بحث في مشاكل العملاء</span>
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="بحث برقم البلاغ، العميل، الموقع، route، أو نوع الخطأ"
            className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pr-11 pl-4 text-sm font-bold text-white outline-none transition placeholder:text-white/28 focus:border-amber-300/50"
          />
        </label>
        <select name="status" defaultValue={filters.status ?? ""} className="h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none">
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="h-12 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none">
          <option value="">كل الأولويات</option>
          {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a]">
          <Filter className="size-4" aria-hidden />
          فلترة
        </button>
      </form>

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs font-black text-white/45">
              <th className="px-4 py-3 text-right">رقم البلاغ</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">الأولوية</th>
              <th className="px-4 py-3 text-right">العميل</th>
              <th className="px-4 py-3 text-right">الموقع</th>
              <th className="px-4 py-3 text-right">الخطأ / Route</th>
              <th className="px-4 py-3 text-right">مرات الظهور</th>
              <th className="px-4 py-3 text-right">آخر تحديث</th>
              <th className="px-4 py-3 text-right">المراجع</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm font-bold text-white/45">لا توجد بلاغات مطابقة حاليًا</td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 text-white/75 transition hover:bg-white/[0.035]">
                  <td className="px-4 py-3">
                    <Link href={issueHref(row)} className="font-mono text-xs font-black text-amber-200 no-underline hover:text-amber-100">
                      {row.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", statusClasses[row.status])}>{statusLabels[row.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", priorityClasses[row.priority])}>{priorityLabels[row.priority]}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.customer ? (
                      <Link href={`/admin/customers/${row.customer.id}`} className="font-black text-white no-underline hover:text-amber-100">
                        {row.customer.name}
                      </Link>
                    ) : (
                      <span className="text-white/35">زائر غير مسجل</span>
                    )}
                    {row.customer?.email ? <p className="mt-1 text-xs text-white/38">{row.customer.email}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    {row.site ? (
                      <Link href={`/admin/sites/${row.site.id}`} className="font-black text-white no-underline hover:text-amber-100">
                        {row.site.title}
                      </Link>
                    ) : (
                      <span className="text-white/35">{row.tenant?.name ?? "غير مرتبط"}</span>
                    )}
                    {row.site?.slug ? <p className="mt-1 text-xs text-white/38">/{row.site.slug}</p> : null}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="font-black text-white/82">{row.errorType ?? row.title}</p>
                    <p className="mt-1 truncate font-mono text-xs text-white/42">{row.route ?? row.sourceArea ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-black text-white">{row.occurrenceCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-white/45">{formatDate(row.updatedAt)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-white/45">{row.assigneeName ?? "غير مسند"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs font-bold text-white/45">
        <span>إجمالي النتائج: {result.total}</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-4" aria-hidden />
          التفاصيل التقنية محفوظة داخل صفحة البلاغ فقط
        </span>
      </div>
    </AdminPageShell>
  );
}
