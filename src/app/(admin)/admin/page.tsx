import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils/cn";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createAdminOverviewViewModel } from "@/modules/admin/admin-overview-view-model";
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession();

  const repository = createPrismaAdminOverviewRepository(prisma);
  const metrics = await repository.getMetrics(new Date());
  const overview = createAdminOverviewViewModel(metrics);

  const [totalTenants, totalUsers, recentCustomers, pendingPayments] =
    await Promise.all([
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          displayName: true,
          status: true,
          createdAt: true,
          owner: { select: { email: true, name: true } },
          _count: { select: { sites: true } },
        },
      }),
      prisma.paymentRequest.findMany({
        where: { status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          method: true,
          createdAt: true,
          tenant: { select: { displayName: true } },
        },
      }),
    ]);

  const adminName = session.user.name;

  return (
    <main className="grid gap-5">
      <section className="grid gap-4 rounded-2xl border border-amber-500/15 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.16),transparent_35%),linear-gradient(135deg,#181b22,#0d0f14)] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-extrabold text-[#f3cf73]">
              مركز تحكم FrameID
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight text-[#fff7e8] sm:text-3xl lg:text-4xl">
              أهلاً، {adminName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              الشاشة دي بتوريك إيه محتاج تدخلك دلوقتي: المدفوعات، التجارب، العملاء الجدد، وصحة المواقع.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
            <ActionButton href="/admin/customers/new" icon={Plus} label="ضيف عميل" variant="primary" />
            <ActionButton href="/admin/sites" icon={ExternalLink} label="عرض المواقع" />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            href={overview.primaryAction.href}
            className={cn(
              "group grid gap-3 rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5",
              overview.primaryAction.tone === "danger"
                ? "border-red-400/25 bg-red-500/10"
                : overview.primaryAction.tone === "warning"
                  ? "border-amber-400/25 bg-amber-500/10"
                  : "border-emerald-400/20 bg-emerald-500/10",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-white/45">المهم دلوقتي</p>
                <h2 className="mt-1 text-lg font-black text-[#fff7e8]">
                  {overview.primaryAction.label}
                </h2>
              </div>
              <ArrowLeft className="mt-1 size-5 text-white/40 transition group-hover:text-[#f3cf73]" />
            </div>
            <p className="max-w-2xl text-sm font-bold leading-7 text-white/58">
              {overview.primaryAction.description}
            </p>
          </Link>

          <div className="grid gap-2 rounded-2xl border border-white/8 bg-white/4 p-4">
            <p className="text-xs font-black text-white/45">صحة المنصة</p>
            {overview.healthItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-bold text-white/75">
                  <HealthDot status={item.status} />
                  {item.label}
                </span>
                <strong className="text-xs font-black text-white/55">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="كل العملاء" value={totalTenants} icon={Users} href="/admin/customers" />
        <MetricCard label="المواقع المنشورة" value={metrics.activeSites} icon={Globe} href="/admin/sites" />
        <MetricCard label="المستخدمين" value={totalUsers} icon={TrendingUp} href="/admin/analytics" />
        <MetricCard
          label="إيرادات الشهر"
          value={`${metrics.monthlyRevenue.toLocaleString()} ${metrics.currency}`}
          icon={WalletCards}
          href="/admin/payments"
          accent
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StartCard label="مراجعة المدفوعات" desc={`${metrics.pendingPayments} طلب معلق`} icon={CreditCard} href="/admin/payments" urgent={metrics.pendingPayments > 0} />
        <StartCard label="متابعة التجارب" desc={`${metrics.expiringTrials} حتنتهي قريب`} icon={UserCheck} href="/admin/customers" urgent={metrics.expiringTrials > 0} />
        <StartCard label="تحليلات المنصة" desc="نمو العملاء والاستخدام" icon={BarChart3} href="/admin/analytics" />
        <StartCard label="الأمان والصلاحيات" desc="الجلسات والدخول والمراجعة" icon={ShieldCheck} href="/admin/security" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="آخر العملاء"
          description="أحدث الحسابات اللي دخلت المنصة."
          href="/admin/customers"
          cta="عرض العملاء"
        >
          {recentCustomers.length > 0 ? (
            <div className="grid gap-2">
              {recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8"
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-white/90">{customer.displayName}</strong>
                    <small className="block truncate text-xs font-bold text-white/45">{customer.owner.email}</small>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-black text-white/35">{customer._count.sites} مواقع</span>
                    <StatusPill status={customer.status} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="لسه مفيش عملاء" description="ابدأ بإضافة أول عميل من زر الإضافة بالأعلى." />
          )}
        </Panel>

        <Panel
          title="مدفوعات محتاجة مراجعة"
          description="طلبات الدفع المعلقة بتأثر على تفعيل العملاء."
          href="/admin/payments"
          cta="مراجعة المدفوعات"
          highlighted={pendingPayments.length > 0}
        >
          {pendingPayments.length > 0 ? (
            <div className="grid gap-2">
              {pendingPayments.map((payment) => (
                <Link
                  key={payment.id}
                  href="/admin/payments"
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8"
                >
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-white/90">{payment.tenant.displayName}</strong>
                    <small className="block text-xs font-bold text-white/45">
                      {payment.amount.toLocaleString()} ج.م · {payment.method}
                    </small>
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-300">
                    قيد المراجعة
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="مفيش مدفوعات معلقة" description="كل طلبات الدفع الحالية اتراجعت." />
          )}
        </Panel>
      </section>
    </main>
  );
}

function ActionButton({
  href,
  icon: Icon,
  label,
  variant,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  variant?: "primary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black no-underline transition",
        variant === "primary"
          ? "border border-amber-500/60 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-[#17120a] shadow-lg hover:-translate-y-0.5 hover:shadow-amber-500/30"
          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-white/8 bg-white/4 p-4 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/6">
      <Icon size={18} className={accent ? "text-[#f3cf73]" : "text-white/55"} />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className={cn("mt-1 truncate text-2xl font-black", accent ? "text-[#f3cf73]" : "text-[#fff7e8]")}>{value}</p>
    </Link>
  );
}

function StartCard({
  label,
  desc,
  icon: Icon,
  href,
  urgent,
}: {
  label: string;
  desc: string;
  icon: LucideIcon;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5",
        urgent ? "border-amber-500/25 bg-amber-500/8" : "border-white/8 bg-white/4",
      )}
    >
      <span className={cn("grid size-11 place-items-center rounded-xl", urgent ? "bg-amber-500/15 text-amber-300" : "bg-white/7 text-white/55")}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm font-bold text-[#fff7e8]">{label}</strong>
        <small className="block truncate text-xs font-bold text-white/45">{desc}</small>
      </span>
      <ArrowLeft size={16} className="text-white/35 transition group-hover:text-[#f3cf73]" />
    </Link>
  );
}

function Panel({
  title,
  description,
  href,
  cta,
  children,
  highlighted,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border p-4", highlighted ? "border-amber-500/16 bg-amber-500/5" : "border-white/8 bg-white/4")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
        <Link href={href} className="shrink-0 text-xs font-black text-amber-400/80 no-underline hover:text-amber-300">
          {cta}
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
      <Icon className="size-7 text-white/30" />
      <strong className="text-sm font-black text-white/65">{title}</strong>
      <p className="max-w-xs text-xs font-bold leading-6 text-white/40">{description}</p>
    </div>
  );
}

function HealthDot({ status }: { status: "healthy" | "watch" | "needs-attention" }) {
  const color =
    status === "needs-attention"
      ? "bg-red-400"
      : status === "watch"
        ? "bg-amber-400"
        : "bg-emerald-400";
  return <span className={cn("size-2.5 rounded-full", color)} />;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-300",
    TRIAL: "bg-amber-500/10 text-amber-300",
    EXPIRED: "bg-red-500/10 text-red-300",
    TRIAL_EXPIRED: "bg-red-500/10 text-red-300",
    SUSPENDED: "bg-red-500/10 text-red-300",
  };
  const labels: Record<string, string> = {
    ACTIVE: "نشط",
    TRIAL: "تجربة",
    EXPIRED: "منتهي",
    TRIAL_EXPIRED: "منتهي",
    SUSPENDED: "موقف",
  };

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-black", styles[status] ?? "bg-white/8 text-white/45")}>
      {labels[status] ?? status}
    </span>
  );
}
