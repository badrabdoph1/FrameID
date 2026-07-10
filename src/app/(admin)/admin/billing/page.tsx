import Link from "next/link";
import { ArrowLeft, BadgeCheck, Banknote, CheckCircle2, Clock, CreditCard, Settings, WalletCards, XCircle, type LucideIcon } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency = "EGP") {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(value);
}

export default async function AdminBillingWorkspacePage() {
  await requireAdminPermission("payments", "view");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const [
    pendingPayments,
    approvedRevenue,
    rejectedThisMonth,
    subscriptionStats,
    expiringSubscriptions,
    plans,
    paymentSettings,
    recentPayments,
  ] = await Promise.all([
    prisma.paymentRequest.count({
      where: { status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] }, deletedAt: null },
    }),
    prisma.paymentRequest.aggregate({
      where: { status: "APPROVED", reviewedAt: { gte: startOfMonth }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.paymentRequest.count({
      where: { status: "REJECTED", reviewedAt: { gte: startOfMonth }, deletedAt: null },
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.subscription.findMany({
      where: {
        deletedAt: null,
        status: { in: ["TRIAL", "ACTIVE", "PAST_DUE"] },
        OR: [
          { currentPeriodEnd: { gte: now, lte: soon } },
          { expiresAt: { gte: now, lte: soon } },
        ],
      },
      orderBy: [{ currentPeriodEnd: "asc" }, { expiresAt: "asc" }],
      take: 8,
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        expiresAt: true,
        tenant: { select: { id: true, displayName: true, owner: { select: { email: true } } } },
        plan: { select: { name: true } },
      },
    }),
    prisma.plan.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { priceAmount: "asc" }],
      take: 6,
      select: { id: true, name: true, code: true, priceAmount: true, currency: true, billingInterval: true, isActive: true },
    }),
    prisma.paymentAccount.groupBy({
      by: ["method"],
      orderBy: [{ method: "asc" }],
      _count: { id: true },
    }),
    prisma.paymentRequest.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        createdAt: true,
        tenant: { select: { id: true, displayName: true } },
        plan: { select: { name: true } },
      },
    }),
  ]);

  const subscriptionCount = new Map(subscriptionStats.map((item) => [item.status, item._count._all]));
  const monthRevenue = approvedRevenue._sum.amount ?? 0;

  return (
    <AdminPageShell
      badge="المال"
      title="الاشتراكات والمدفوعات"
      description="كل ما يخص الإيراد والتفعيل اليدوي في Workspace واحد: الطلبات، الإثباتات، الاشتراكات، الباقات، وإعدادات الدفع."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المال" }]}
      actions={[
        { label: "مراجعة المدفوعات", href: "/admin/payments", icon: CreditCard },
        { label: "إعدادات الدفع", href: "/admin/settings/payment", icon: Settings },
      ]}
    >
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="طلبات معلقة" value={pendingPayments} icon={Clock} tone={pendingPayments > 0 ? "warning" : "success"} href="/admin/payments" />
          <MetricCard label="إيراد الشهر" value={formatMoney(monthRevenue)} icon={WalletCards} tone="gold" href="/admin/payments" />
          <MetricCard label="اشتراكات نشطة" value={subscriptionCount.get("ACTIVE") ?? 0} icon={CheckCircle2} tone="success" href="/admin/subscriptions" />
          <MetricCard label="مرفوض هذا الشهر" value={rejectedThisMonth} icon={XCircle} tone={rejectedThisMonth > 0 ? "danger" : "neutral"} href="/admin/payments" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <WorkspacePanel
            title="طلبات تحتاج مراجعة"
            description="أهم جزء يومي: إثباتات الدفع التي تحتاج قرار قبول أو رفض."
            href="/admin/payments"
            cta="فتح مركز المدفوعات"
          >
            <div className="grid gap-2">
              {recentPayments.length === 0 ? <EmptyState text="لا توجد طلبات دفع حتى الآن." /> : recentPayments.map((payment) => (
                <Link key={payment.id} href="/admin/payments" className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8 sm:grid-cols-[1fr_auto] sm:items-center">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{payment.tenant.displayName}</strong>
                    <small className="mt-1 block text-xs font-bold text-white/42">{payment.plan?.name ?? "بدون خطة"} · {payment.method} · {formatDate(payment.createdAt)}</small>
                  </span>
                  <span className="flex items-center justify-between gap-2 sm:justify-end">
                    <StatusBadge status={payment.status} />
                    <strong className="text-sm font-black text-[#f3cf73]">{formatMoney(payment.amount, payment.currency)}</strong>
                  </span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="اشتراكات قريبة الانتهاء"
            description="تابع التجارب والاشتراكات قبل ما العميل يتوقف."
            href="/admin/subscriptions"
            cta="عرض الاشتراكات"
          >
            <div className="grid gap-2">
              {expiringSubscriptions.length === 0 ? <EmptyState text="لا توجد اشتراكات أو تجارب قريبة الانتهاء خلال 7 أيام." /> : expiringSubscriptions.map((subscription) => (
                <Link key={subscription.id} href={`/admin/customers/${subscription.tenant.id}`} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-black text-[#fff7e8]">{subscription.tenant.displayName}</strong>
                      <small className="mt-1 block truncate text-xs font-bold text-white/42">{subscription.tenant.owner.email}</small>
                    </span>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-white/48">{subscription.plan?.name ?? "بدون خطة"} · تنتهي: {formatDate(subscription.currentPeriodEnd ?? subscription.expiresAt)}</p>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <WorkspacePanel title="الباقات" description="إدارة الأسعار والميزات بدون الدخول لمكان منفصل كل مرة." href="/admin/plans" cta="إدارة الباقات">
            <div className="grid gap-2">
              {plans.map((plan) => (
                <Link key={plan.id} href="/admin/plans" className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{plan.name}</strong>
                    <small className="mt-1 block truncate text-xs font-bold text-white/38">{plan.code} · {plan.billingInterval}</small>
                  </span>
                  <span className="shrink-0 text-left">
                    <strong className="block text-sm font-black text-[#f3cf73]">{formatMoney(plan.priceAmount, plan.currency)}</strong>
                    <small className={plan.isActive ? "text-xs font-black text-emerald-300" : "text-xs font-black text-white/35"}>{plan.isActive ? "فعالة" : "متوقفة"}</small>
                  </span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="وسائل الدفع" description="حالة قنوات الدفع والحسابات المرتبطة بها." href="/admin/settings/payment" cta="إعدادات الدفع">
            <div className="grid gap-2">
              {paymentSettings.length === 0 ? <EmptyState text="لا توجد وسائل دفع مفعلة." /> : paymentSettings.map((method) => (
                <Link key={method.method} href="/admin/settings/payment" className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{method.method}</strong>
                    <small className="mt-1 block text-xs font-bold text-white/38">{method._count.id} حسابات مرتبطة</small>
                  </span>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        </section>
      </div>
    </AdminPageShell>
  );
}

function MetricCard({ label, value, icon: Icon, tone, href }: { label: string; value: number | string; icon: LucideIcon; tone: "success" | "warning" | "danger" | "gold" | "neutral"; href: string }) {
  const toneClass = tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : tone === "danger" ? "text-red-300" : tone === "gold" ? "text-[#f3cf73]" : "text-[#fff7e8]";
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8">
      <Icon className={`size-5 ${toneClass}`} />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className={`mt-1 truncate text-2xl font-black ${toneClass}`}>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
    </Link>
  );
}

function WorkspacePanel({ title, description, href, cta, children }: { title: string; description: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/62 no-underline transition hover:bg-white/[0.08] hover:text-white">
          {cta}
          <ArrowLeft className="size-3.5" />
        </Link>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "APPROVED" || status === "ACTIVE" ? "bg-emerald-300/10 text-emerald-300" : status === "REJECTED" || status === "EXPIRED" || status === "PAST_DUE" ? "bg-red-300/10 text-red-300" : "bg-amber-300/10 text-amber-300";
  return <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${cls}`}>{status}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center text-sm font-bold text-white/40">{text}</div>;
}
