import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LifeBuoy,
  TimerReset,
  Users,
  WalletCards,
} from "lucide-react";

import {
  AdminEmptyState,
  AdminMetricCard,
  AdminMetricsGrid,
  AdminStatusBadge,
  AdminWorkspacePanel,
  type AdminMetricTone,
} from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createAdminOverviewViewModel } from "@/modules/admin/admin-overview-view-model";
import { getCustomerIssueStats } from "@/modules/customer-issues/admin-queries";

export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession();
  const now = new Date();
  const week = addDays(now, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    trialCustomers,
    activeSubscribers,
    expiringTrials,
    expiringSubscriptions,
    expiredCustomers,
    pendingPayments,
    noRenewalCustomers,
    needsFollowUp,
    activeSites,
    revenue,
    recentCustomers,
    issueStats,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL" } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "ACTIVE", subscriptions: { some: { status: "ACTIVE" } } } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL", trialEndsAt: { gte: now, lte: week } } }),
    prisma.subscription.count({ where: { status: "ACTIVE", OR: [{ currentPeriodEnd: { gte: now, lte: week } }, { expiresAt: { gte: now, lte: week } }] } }),
    prisma.tenant.count({ where: { deletedAt: null, OR: [{ status: { in: ["EXPIRED", "TRIAL_EXPIRED"] } }, { subscriptions: { some: { status: "EXPIRED" } } }] } }),
    prisma.paymentRequest.count({ where: { deletedAt: null, status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] } } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL_EXPIRED", payments: { none: { status: "APPROVED" } } } }),
    prisma.tenant.count({ where: { deletedAt: null, OR: [{ status: "TRIAL_EXPIRED" }, { payments: { some: { deletedAt: null, status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] } } } }, { sites: { none: { deletedAt: null, isPublished: true } } }] } }),
    prisma.site.count({ where: { deletedAt: null, isPublished: true } }),
    prisma.paymentRequest.aggregate({ where: { deletedAt: null, status: "APPROVED", reviewedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.tenant.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, displayName: true, status: true, owner: { select: { email: true } }, subscriptions: { where: {}, orderBy: { createdAt: "desc" }, take: 1, select: { status: true, currentPeriodEnd: true, expiresAt: true } } } }),
    getCustomerIssueStats(),
  ]);

  const overview = createAdminOverviewViewModel({
    newUsersToday: 0,
    activeTrials: trialCustomers,
    expiringTrials,
    pendingPayments,
    activeSites,
    monthlyRevenue: revenue._sum.amount ?? 0,
    currency: "EGP",
    totalCustomers,
    activeSubscribers,
    expiringSubscriptions,
    expiredCustomers,
    noRenewalCustomers,
    needsFollowUp,
    newIssues: issueStats.new,
    issuesInReview: issueStats.inReview,
  });

  const metricIcons = {
    customers: Users,
    subscribers: CheckCircle2,
    payments: CreditCard,
    revenue: WalletCards,
  } as const;

  return (
    <AdminPageShell
      badge="ملخص اليوم"
      title="لوحة القيادة"
      description={`أهلًا ${session.user.name}، ابدأ بالأعمال التي تحتاج قرارًا ثم تابع حالة المنصة.`}
    >
      <section aria-labelledby="admin-priority-heading">
        <h2 id="admin-priority-heading" className="mb-3 text-lg font-black text-[#fff7e8]">ما يحتاج تدخلك الآن</h2>
        {overview.priority.href ? (
          <Link
            href={overview.priority.href}
            className={`group flex min-h-28 items-center justify-between gap-4 rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5 ${overview.priority.tone === "danger" ? "border-red-300/20 bg-red-500/10" : "border-amber-300/20 bg-amber-300/10"}`}
          >
            <div>
              <AdminStatusBadge label="أولوية" tone={overview.priority.tone} />
              <h3 className="mt-3 text-lg font-black text-[#fff7e8]">{overview.priority.label}</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-white/52">{overview.priority.description}</p>
            </div>
            <ArrowLeft aria-hidden="true" className="size-5 shrink-0 text-[#f3cf73] transition group-hover:-translate-x-1" />
          </Link>
        ) : (
          <div role="status" className="flex min-h-28 items-center gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/12">
              <CheckCircle2 aria-hidden="true" className="size-6 text-emerald-300" />
            </span>
            <div>
              <h3 className="text-lg font-black text-[#fff7e8]">{overview.priority.label}</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-white/52">{overview.priority.description}</p>
            </div>
          </div>
        )}
      </section>

      <AdminMetricsGrid>
        {overview.metrics.map((metric) => (
          <AdminMetricCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            href={metric.href}
            icon={metricIcons[metric.id as keyof typeof metricIcons]}
            tone={metric.tone as AdminMetricTone}
          />
        ))}
      </AdminMetricsGrid>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminWorkspacePanel
          title="قائمة العمل"
          description="بنود حقيقية مرتبة لتصل مباشرة إلى القائمة المفلترة."
          action={{ label: "كل العمليات", href: "/admin/operations" }}
        >
          {overview.workQueue.length > 0 ? (
            <div className="grid gap-2">
              {overview.workQueue.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-3 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8"
                >
                  <span className="text-sm font-black text-white/72">{item.label}</span>
                  <AdminStatusBadge label={item.value.toLocaleString("ar-EG")} tone={item.tone} />
                </Link>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="قائمة العمل هادئة"
              description="ستظهر هنا تلقائيًا المدفوعات والبلاغات والحسابات التي تحتاج متابعة."
              icon={CheckCircle2}
            />
          )}
        </AdminWorkspacePanel>

        <AdminWorkspacePanel
          title="مشاكل العملاء"
          description="راجع البلاغات الجديدة ثم تابع ما هو قيد المراجعة."
          action={{ label: "مشاكل العملاء", href: "/admin/errors" }}
        >
          <Link href="/admin/errors" className="grid gap-2 no-underline sm:grid-cols-3">
            <IssueCount label="بلاغ جديد" value={issueStats.new} tone={issueStats.new > 0 ? "danger" : "neutral"} />
            <IssueCount label="قيد المراجعة" value={issueStats.inReview} tone="warning" />
            <IssueCount label="محلولة" value={issueStats.resolved} tone="success" />
          </Link>
        </AdminWorkspacePanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <AdminWorkspacePanel
          title="أحدث العملاء"
          description="وصول سريع إلى الحسابات التي انضمت مؤخرًا."
          action={{ label: "عرض كل العملاء", href: "/admin/customers" }}
        >
          {recentCustomers.length > 0 ? (
            <div className="grid gap-2">
              {recentCustomers.map((customer) => {
                const subscription = customer.subscriptions[0];
                const end = subscription?.currentPeriodEnd ?? subscription?.expiresAt;

                return (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="grid min-h-14 gap-1 rounded-xl border border-white/8 bg-black/15 p-3 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8"
                  >
                    <strong className="text-sm font-black text-[#fff7e8]">{customer.displayName}</strong>
                    <span className="text-xs font-bold text-white/45">
                      {customer.owner.email} · {customer.status}
                      {end ? ` · ينتهي ${new Date(end).toLocaleDateString("ar-EG")}` : ""}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState
              title="لم ينضم أي عميل بعد"
              description="عند إنشاء أول حساب سيظهر هنا مع رابط مباشر لتفاصيله."
              icon={Users}
            />
          )}
        </AdminWorkspacePanel>

        <AdminWorkspacePanel
          title="حالة دورة العميل"
          description="ملخص سريع دون تكرار أدوات إدارة العملاء."
          action={{ label: "مركز العملاء", href: "/admin/customers" }}
        >
          <div className="grid gap-2">
            <StatusRow label="تجارب نشطة" value={trialCustomers} icon={TimerReset} />
            <StatusRow label="حسابات منتهية" value={expiredCustomers} icon={AlertTriangle} />
            <StatusRow label="لم يجددوا بعد" value={noRenewalCustomers} icon={LifeBuoy} />
          </div>
        </AdminWorkspacePanel>
      </section>
    </AdminPageShell>
  );
}

function IssueCount({ label, value, tone }: { label: string; value: number; tone: AdminMetricTone }) {
  return (
    <span className="rounded-xl border border-white/8 bg-black/15 p-3">
      <span className="block text-xs font-black text-white/42">{label}</span>
      <strong className="mt-2 block text-lg font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")} {label}</strong>
      <span className="mt-2 block"><AdminStatusBadge label={value > 0 ? "يحتاج متابعة" : "هادئ"} tone={tone} /></span>
    </span>
  );
}

function StatusRow({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="flex min-h-13 items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-3">
      <span className="flex items-center gap-2 text-sm font-black text-white/65">
        <Icon aria-hidden="true" className="size-4 text-[#f3cf73]" />
        {label}
      </span>
      <strong className="text-base font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</strong>
    </div>
  );
}
