import Link from "next/link";
import { Activity, Download, Filter, Search, ShieldCheck, UserRound } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const HIGH_RISK_ACTIONS = [
  "PAYMENT_APPROVED",
  "PAYMENT_REJECTED",
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_CANCELLED",
  "CUSTOMER_PASSWORD_RESET",
  "CUSTOMER_DELETED",
  "SITE_SUSPENDED",
  "ADMIN_IMPERSONATED",
  "BACKUP_RESTORED",
  "FEATURE_FLAG_CHANGED",
];

type Props = {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entityType?: string;
    tenantId?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

function normalize(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 160);
}

function asDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

function dateTime(value: Date): string {
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(value: string | null | undefined): string {
  if (!value) return "—";
  return value.length > 12 ? `${value.slice(0, 12)}…` : value;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  await requireAdminPermission("audit", "view");

  const params = await searchParams;
  const q = normalize(params.q);
  const action = normalize(params.action);
  const entityType = normalize(params.entityType);
  const tenantId = normalize(params.tenantId);
  const actorId = normalize(params.actorId);
  const page = Math.max(1, Number(params.page) || 1);
  const from = asDate(params.from);
  const to = asDate(params.to, true);

  const where: Record<string, unknown> = {};
  const createdAt: Record<string, Date> = {};

  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    where.OR = [
      { id: contains },
      { action: contains },
      { entityType: contains },
      { entityId: contains },
      { metadata: contains },
      { actor: { email: contains } },
      { actor: { name: contains } },
      { tenant: { displayName: contains } },
    ];
  }

  if (action) where.action = { contains: action, mode: "insensitive" };
  if (entityType) where.entityType = { contains: entityType, mode: "insensitive" };
  if (tenantId) where.tenantId = tenantId;
  if (actorId) where.actorId = actorId;
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = to;
  if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [entries, total, todayCount, riskyCount, entityTypes, topActions] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        tenant: { select: { id: true, displayName: true, status: true } },
      },
    }),
    prisma.auditLog.count({ where: where as never }),
    prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
    prisma.auditLog.count({ where: { action: { in: HIGH_RISK_ACTIONS } } }),
    prisma.auditLog.groupBy({
      by: ["entityType"],
      _count: true,
      orderBy: { _count: { entityType: "desc" } },
      take: 8,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 8,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPageShell
      badge="Security & Governance"
      title="Audit Explorer"
      description="مركز تدقيق فعلي لكل العمليات الإدارية والحساسة داخل FrameID مع بحث وفلاتر وسياق للعميل والفاعل."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "Audit Explorer" }]}
      actions={[{ label: "بحث شامل", href: "/admin/search", icon: Search }, { label: "الأمان", href: "/admin/security", icon: ShieldCheck }]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="النتائج الحالية" value={total.toLocaleString("ar-EG")} icon={Activity} />
        <MetricCard label="أحداث اليوم" value={todayCount.toLocaleString("ar-EG")} icon={ShieldCheck} />
        <MetricCard label="عمليات عالية الخطورة" value={riskyCount.toLocaleString("ar-EG")} icon={Filter} danger />
        <MetricCard label="الصفحة" value={`${page} / ${totalPages}`} icon={UserRound} />
      </section>

      <form action="/admin/audit" className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 xl:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input
            name="q"
            defaultValue={q}
            placeholder="بحث في action, entity, actor, tenant, IP..."
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40"
          />
        </label>
        <input name="action" defaultValue={action} placeholder="Action" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="entityType" defaultValue={entityType} placeholder="Entity" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="tenantId" defaultValue={tenantId} placeholder="Tenant ID" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="from" defaultValue={params.from ?? ""} type="date" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40" />
        <input name="to" defaultValue={params.to ?? ""} type="date" className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40" />
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/12 px-4 text-sm font-black text-amber-200 transition hover:bg-amber-500/20">
          <Filter className="size-4" />
          فلترة
        </button>
      </form>

      <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="hidden grid-cols-[1.1fr_0.8fr_0.9fr_0.9fr_0.8fr] gap-3 border-b border-white/8 bg-white/[0.035] px-4 py-3 text-xs font-black text-white/40 lg:grid">
            <span>العملية</span>
            <span>الكيان</span>
            <span>الفاعل</span>
            <span>العميل</span>
            <span>الوقت</span>
          </div>
          <div className="grid divide-y divide-white/6">
            {entries.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm font-bold text-white/42">لا توجد أحداث مطابقة.</div>
            ) : (
              entries.map((entry) => (
                <article key={entry.id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.025] lg:grid-cols-[1.1fr_0.8fr_0.9fr_0.9fr_0.8fr] lg:items-start">
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{entry.action}</strong>
                    <span className="mt-1 block truncate font-mono text-[0.68rem] text-white/30">{entry.id}</span>
                  </div>
                  <div className="min-w-0 text-sm font-bold text-white/62">
                    <span className="block truncate">{entry.entityType}</span>
                    <span className="font-mono text-[0.68rem] text-white/30">{shortId(entry.entityId)}</span>
                  </div>
                  <div className="min-w-0 text-sm font-bold text-white/62">
                    <span className="block truncate">{entry.actor?.name ?? "النظام"}</span>
                    <span className="block truncate text-xs text-white/32">{entry.actor?.email ?? entry.actorId ?? "system"}</span>
                  </div>
                  <div className="min-w-0 text-sm font-bold text-white/62">
                    {entry.tenant ? (
                      <Link href={`/admin/customers/${entry.tenant.id}`} className="truncate text-white/70 no-underline transition hover:text-amber-300">
                        {entry.tenant.displayName}
                      </Link>
                    ) : (
                      <span className="text-white/30">Platform</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white/38">{dateTime(entry.createdAt)}</div>
                  {entry.metadata ? (
                    <details className="lg:col-span-5 rounded-xl border border-white/8 bg-black/18 p-3">
                      <summary className="cursor-pointer text-xs font-black text-white/45">Metadata / سياق العملية</summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-left text-[11px] leading-5 text-white/52" dir="ltr">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="grid h-fit gap-4">
          <InsightPanel title="أكثر الكيانات نشاطًا" items={entityTypes.map((item) => ({ label: item.entityType, count: item._count }))} />
          <InsightPanel title="أكثر العمليات تكرارًا" items={topActions.map((item) => ({ label: item.action, count: item._count }))} />
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Download className="size-4 text-amber-300" /> تصدير لاحق</h3>
            <p className="mt-2 text-xs font-bold leading-6 text-white/45">تم تجهيز الصفحة كبنية قابلة لإضافة CSV/JSON export مع صلاحية `audit.export` في المرحلة التالية.</p>
          </div>
        </aside>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/45">
        <Link href={buildPageHref(params, page - 1)} className={page <= 1 ? "pointer-events-none opacity-30" : "text-amber-300 no-underline hover:text-amber-200"}>السابق</Link>
        <span>{page} / {totalPages}</span>
        <Link href={buildPageHref(params, page + 1)} className={page >= totalPages ? "pointer-events-none opacity-30" : "text-amber-300 no-underline hover:text-amber-200"}>التالي</Link>
      </div>
    </AdminPageShell>
  );
}

function buildPageHref(params: Awaited<Props["searchParams"]>, page: number): string {
  const qs = new URLSearchParams();
  for (const key of ["q", "action", "entityType", "tenantId", "actorId", "from", "to"] as const) {
    const value = params[key];
    if (value) qs.set(key, value);
  }
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();
  return `/admin/audit${query ? `?${query}` : ""}`;
}

function MetricCard({ label, value, icon: Icon, danger }: { label: string; value: string; icon: typeof Activity; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Icon className={danger ? "size-5 text-red-300" : "size-5 text-amber-300"} />
      <p className="mt-3 text-xs font-black text-white/38">{label}</p>
      <p className={danger ? "mt-1 text-2xl font-black text-red-300" : "mt-1 text-2xl font-black text-[#fff7e8]"}>{value}</p>
    </div>
  );
}

function InsightPanel({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h3 className="text-sm font-black text-[#fff7e8]">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? (
          <p className="text-xs font-bold text-white/40">لا توجد بيانات بعد.</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2 text-xs font-bold text-white/55">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-amber-300">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}