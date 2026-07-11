import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, CreditCard, LifeBuoy, TimerReset, UserCheck, Users, WalletCards } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatMoney(amount: number, currency = "EGP") {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
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
    revenue,
    recentCustomers,
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
    prisma.paymentRequest.aggregate({ where: { deletedAt: null, status: "APPROVED", reviewedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.tenant.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, displayName: true, status: true, owner: { select: { email: true } }, subscriptions: { where: {}, orderBy: { createdAt: "desc" }, take: 1, select: { status: true, currentPeriodEnd: true, expiresAt: true } } } }),
  ]);

  const lifecycleCards = [
    { label: "العملاء التجريبيون", value: trialCustomers, href: "/admin/customers?filter=trial", icon: Users, tone: "amber" },
    { label: "تجارب تنتهي خلال أسبوع", value: expiringTrials, href: "/admin/customers?filter=expiring7", icon: Clock3, tone: "amber" },
    { label: "اشتراكات تنتهي خلال أسبوع", value: expiringSubscriptions, href: "/admin/customers?filter=expiring7", icon: TimerReset, tone: "red" },
    { label: "اشتراكات/تجارب منتهية", value: expiredCustomers, href: "/admin/customers?filter=expired", icon: AlertTriangle, tone: "red" },
    { label: "لم يجددوا بعد", value: noRenewalCustomers, href: "/admin/customers?filter=trialExpiredNoSub", icon: LifeBuoy, tone: "red" },
    { label: "يحتاجون متابعة", value: needsFollowUp, href: "/admin/customers?filter=pendingPayment", icon: UserCheck, tone: "sky" },
  ];

  return (
    <main className="grid gap-5">
      <section className="rounded-[1.6rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.16),transparent_35%),linear-gradient(135deg,#181b22,#0d0f14)] p-5 shadow-2xl lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-[#f3cf73]">Customer Lifecycle Command Center</span>
            <h1 className="mt-3 text-3xl font-black text-[#fff7e8]">أهلاً، {session.user.name}</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">لوحة القيادة الآن تتابع دورة حياة العميل بالكامل: تجربة، دفع، تفعيل، انتهاء، تجديد، ومتابعة.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            <MiniStat label="كل العملاء" value={totalCustomers} icon={Users} href="/admin/customers" />
            <MiniStat label="مشتركين" value={activeSubscribers} icon={CheckCircle2} href="/admin/customers?filter=subscribed" />
            <MiniStat label="مدفوعات معلقة" value={pendingPayments} icon={CreditCard} href="/admin/payments" urgent={pendingPayments > 0} />
            <MiniStat label="دخل الشهر" value={formatMoney(revenue._sum.amount ?? 0)} icon={WalletCards} href="/admin/payments" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lifecycleCards.map((card) => <LifecycleCard key={card.label} {...card} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-black text-[#fff7e8]">آخر العملاء</h2><p className="text-xs font-bold text-white/42">متابعة سريعة لأحدث الحسابات.</p></div>
            <Link href="/admin/customers" className="text-xs font-black text-[#f3cf73] no-underline">كل العملاء</Link>
          </div>
          <div className="grid gap-2">
            {recentCustomers.map((customer) => {
              const sub = customer.subscriptions[0];
              const end = sub?.currentPeriodEnd ?? sub?.expiresAt;
              return <Link key={customer.id} href={`/admin/customers/${customer.id}/workspace`} className="grid gap-1 rounded-2xl border border-white/8 bg-black/14 p-3 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8"><strong className="text-sm font-black text-[#fff7e8]">{customer.displayName}</strong><span className="text-xs font-bold text-white/42">{customer.owner.email} · {customer.status}{end ? ` · ينتهي ${new Date(end).toLocaleDateString("ar-EG")}` : ""}</span></Link>;
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
          <h2 className="text-lg font-black text-[#fff7e8]">اختصارات الإدارة</h2>
          <div className="mt-4 grid gap-2">
            <QuickAction href="/admin/payments" label="مراجعة طلبات الدفع" />
            <QuickAction href="/admin/messages" label="مؤقت لوحة التحكم والرسائل" />
            <QuickAction href="/admin/customers?filter=expiring7" label="عملاء تنتهي مدتهم قريبًا" />
            <QuickAction href="/admin/customers?filter=noPayments" label="عملاء بدون طلبات دفع" />
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniStat({ label, value, icon: Icon, href, urgent = false }: { label: string; value: string | number; icon: typeof Users; href: string; urgent?: boolean }) {
  return <Link href={href} className={`rounded-2xl border p-3 no-underline transition hover:-translate-y-0.5 ${urgent ? "border-red-300/20 bg-red-500/10" : "border-white/10 bg-white/[0.04]"}`}><Icon className="size-5 text-[#f3cf73]" /><p className="mt-2 text-xs font-black text-white/42">{label}</p><p className="mt-1 text-xl font-black text-[#fff7e8]">{value}</p></Link>;
}

function LifecycleCard({ label, value, href, icon: Icon, tone }: { label: string; value: number; href: string; icon: typeof Users; tone: string }) {
  const toneClass = tone === "red" ? "border-red-300/20 bg-red-500/10 text-red-200" : tone === "sky" ? "border-sky-300/20 bg-sky-500/10 text-sky-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return <Link href={href} className={`group rounded-[1.35rem] border p-4 no-underline transition hover:-translate-y-1 ${toneClass}`}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Icon className="size-5" /></span><ArrowLeft className="size-4 opacity-40 transition group-hover:opacity-100" /></div><p className="mt-4 text-sm font-black opacity-75">{label}</p><p className="mt-1 text-3xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</p></Link>;
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex min-h-12 items-center justify-between rounded-2xl border border-white/8 bg-black/14 px-4 text-sm font-black text-white/70 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8 hover:text-white"><span>{label}</span><ArrowLeft className="size-4 text-[#f3cf73]" /></Link>;
}
