import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  DatabaseBackup,
  ExternalLink,
  Globe,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils/cn";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(value);
}

function formatMoney(amount: number, currency = "EGP") {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const [
    totalCustomers,
    activeSites,
    pendingPayments,
    monthRevenue,
    expiringTrials,
    unresolvedErrors,
    unreadNotifications,
    failedBackups,
    recentCustomers,
    reviewPayments,
    expiringTenants,
    recentErrors,
    importantNotifications,
    latestBackup,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.site.count({ where: { deletedAt: null, isPublished: true } }),
    prisma.paymentRequest.count({ where: { status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] }, deletedAt: null } }),
    prisma.paymentRequest.aggregate({ where: { status: "APPROVED", reviewedAt: { gte: startOfMonth }, deletedAt: null }, _sum: { amount: true } }),
    prisma.tenant.count({ where: { deletedAt: null, status: "TRIAL", trialEndsAt: { gte: now, lte: soon } } }),
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.notificationLog.count({ where: { readAt: null, deletedAt: null } }),
    prisma.backupJob.count({ where: { status: { in: ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"] } } }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        displayName: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        owner: { select: { email: true, name: true } },
        _count: { select: { sites: true, payments: true } },
      },
    }),
    prisma.paymentRequest.findMany({
      where: { status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        createdAt: true,
        tenant: { select: { id: true, displayName: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null, status: "TRIAL", trialEndsAt: { gte: now, lte: soon } },
      orderBy: { trialEndsAt: "asc" },
      take: 6,
      select: { id: true, displayName: true, trialEndsAt: true, owner: { select: { email: true } } },
    }),
    prisma.errorLog.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, code: true, message: true, level: true, category: true, createdAt: true },
    }),
    prisma.notificationLog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, title: true, category: true, createdAt: true, readAt: true },
    }),
    prisma.backupJob.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, status: true, createdAt: true, completedAt: true },
    }),
  ]);

  const monthRevenueAmount = monthRevenue._sum.amount ?? 0;
  const urgentItems = [
    pendingPayments > 0 ? { label: "راجع المدفوعات المعلقة", description: `${pendingPayments} طلب دفع ينتظر القرار`, href: "/admin/payments", tone: "warning" as const } : null,
    expiringTrials > 0 ? { label: "تابع التجارب القريبة", description: `${expiringTrials} تجربة تنتهي خلال 7 أيام`, href: "/admin/customers?status=TRIAL", tone: "warning" as const } : null,
    unresolvedErrors > 0 ? { label: "حل أخطاء النظام", description: `${unresolvedErrors} خطأ غير محلول`, href: "/admin/errors", tone: "danger" as const } : null,
    failedBackups > 0 ? { label: "راجع النسخ الاحتياطي", description: `${failedBackups} عملية نسخ فاشلة`, href: "/admin/backups", tone: "danger" as const } : null,
  ].filter(Boolean) as Array<{ label: string; description: string; href: string; tone: "warning" | "danger" }>;

  const primaryAction = urgentItems[0] ?? { label: "المنصة مستقرة", description: "لا توجد مهام حرجة الآن. راجع آخر العملاء أو المدفوعات عند الحاجة.", href: "/admin/customers", tone: "success" as const };

  return (
    <main className="grid gap-5">
      <section className="grid gap-4 rounded-2xl border border-amber-500/15 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.16),transparent_35%),linear-gradient(135deg,#181b22,#0d0f14)] p-5 shadow-2xl sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-extrabold text-[#f3cf73]">
              مركز القيادة اليومي
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight text-[#fff7e8] sm:text-3xl lg:text-4xl">
              أهلاً، {session.user.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              الصفحة دي مصممة لاستخدامك اليومي: تشوف ما يحتاج تدخلك، تراجع الدفع، تتابع العملاء، وتطمئن على النظام من غير تنقل كتير.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
            <ActionButton href="/admin/customers/new" icon={Plus} label="ضيف عميل" variant="primary" />
            <ActionButton href="/admin/search" icon={Search} label="بحث سريع" />
            <ActionButton href="/admin/billing" icon={WalletCards} label="المال" />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <Link
            href={primaryAction.href}
            className={cn(
              "group grid gap-3 rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5",
              primaryAction.tone === "danger"
                ? "border-red-400/25 bg-red-500/10"
                : primaryAction.tone === "warning"
                  ? "border-amber-400/25 bg-amber-500/10"
                  : "border-emerald-400/20 bg-emerald-500/10",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-white/45">أهم إجراء الآن</p>
                <h2 className="mt-1 text-lg font-black text-[#fff7e8]">{primaryAction.label}</h2>
              </div>
              <ArrowLeft className="mt-1 size-5 text-white/40 transition group-hover:text-[#f3cf73]" />
            </div>
            <p className="max-w-2xl text-sm font-bold leading-7 text-white/58">{primaryAction.description}</p>
          </Link>

          <div className="grid gap-2 rounded-2xl border border-white/8 bg-white/4 p-4">
            <p className="text-xs font-black text-white/45">حالة المنصة الآن</p>
            <HealthRow label="الأخطاء" value={unresolvedErrors > 0 ? `${unresolvedErrors} مفتوحة` : "مستقر"} bad={unresolvedErrors > 0} />
            <HealthRow label="النسخ الاحتياطي" value={latestBackup ? `${latestBackup.status} · ${formatDate(latestBackup.completedAt ?? latestBackup.createdAt)}` : "لا توجد نسخ"} bad={failedBackups > 0} />
            <HealthRow label="الإشعارات" value={unreadNotifications > 0 ? `${unreadNotifications} جديد` : "لا جديد"} bad={false} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="العملاء" value={totalCustomers} icon={Users} href="/admin/customers" />
        <MetricCard label="المواقع المنشورة" value={activeSites} icon={Globe} href="/admin/customers" />
        <MetricCard label="مدفوعات معلقة" value={pendingPayments} icon={CreditCard} href="/admin/payments" urgent={pendingPayments > 0} />
        <MetricCard label="إيراد الشهر" value={formatMoney(monthRevenueAmount)} icon={WalletCards} href="/admin/billing" accent />
      </section>

      {urgentItems.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {urgentItems.map((item) => <StartCard key={item.href} label={item.label} desc={item.description} href={item.href} urgent={item.tone === "danger"} />)}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="مدفوعات تنتظر المراجعة" description="افتح الطلب، راجع الإثبات، ثم فعّل أو ارفض." href="/admin/payments" cta="مراجعة المدفوعات" highlighted={reviewPayments.length > 0}>
          {reviewPayments.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="مفيش مدفوعات معلقة" description="كل طلبات الدفع الحالية متراجعة." />
          ) : (
            <div className="grid gap-2">
              {reviewPayments.map((payment) => (
                <Link key={payment.id} href="/admin/payments" className="grid gap-2 rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8 sm:grid-cols-[1fr_auto] sm:items-center">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-white/90">{payment.tenant.displayName}</strong>
                    <small className="block text-xs font-bold text-white/45">{payment.plan?.name ?? "بدون خطة"} · {payment.method} · {formatDate(payment.createdAt)}</small>
                  </span>
                  <span className="flex items-center justify-between gap-2 sm:justify-end">
                    <strong className="text-sm font-black text-[#f3cf73]">{formatMoney(payment.amount, payment.currency)}</strong>
                    <StatusPill status={payment.status} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="تجارب تنتهي قريبًا" description="فرصة للتواصل قبل توقف العميل." href="/admin/customers?status=TRIAL" cta="عرض العملاء">
          {expiringTenants.length === 0 ? (
            <EmptyState icon={Sparkles} title="لا توجد تجارب قريبة" description="لا توجد تجارب مجانية تنتهي خلال 7 أيام." />
          ) : (
            <div className="grid gap-2">
              {expiringTenants.map((tenant) => (
                <Link key={tenant.id} href={`/admin/customers/${tenant.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-white/90">{tenant.displayName}</strong>
                    <small className="block truncate text-xs font-bold text-white/45">{tenant.owner.email}</small>
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-300">{formatDate(tenant.trialEndsAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="آخر العملاء" description="أحدث الحسابات التي دخلت المنصة." href="/admin/customers" cta="فتح Workspace العملاء">
          {recentCustomers.length > 0 ? (
            <div className="grid gap-2">
              {recentCustomers.map((customer) => (
                <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8">
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
          ) : <EmptyState icon={Sparkles} title="لسه مفيش عملاء" description="ابدأ بإضافة أول عميل من زر الإضافة بالأعلى." />}
        </Panel>

        <Panel title="النظام والتنبيهات" description="الأخطاء والإشعارات والنسخ في نظرة واحدة." href="/admin/system" cta="فتح Workspace النظام" highlighted={recentErrors.length > 0}>
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <SystemMiniCard label="أخطاء" value={unresolvedErrors} href="/admin/errors" icon={TriangleAlert} danger={unresolvedErrors > 0} />
              <SystemMiniCard label="إشعارات" value={unreadNotifications} href="/admin/notifications" icon={Bell} />
              <SystemMiniCard label="نسخ" value={failedBackups} href="/admin/backups" icon={DatabaseBackup} danger={failedBackups > 0} />
            </div>
            {recentErrors.length > 0 ? (
              <div className="grid gap-2">
                {recentErrors.slice(0, 3).map((error) => (
                  <Link key={error.id} href="/admin/errors" className="rounded-xl border border-red-300/12 bg-red-500/8 px-3.5 py-3 no-underline transition hover:border-red-300/24">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-300/10 px-2 py-0.5 text-[0.68rem] font-black text-red-300">{error.level}</span>
                      <strong className="text-xs font-black text-[#f3cf73]">{error.code}</strong>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-bold text-white/70">{error.message}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid gap-2">
                {importantNotifications.slice(0, 3).map((item) => (
                  <Link key={item.id} href="/admin/notifications" className="rounded-xl border border-white/6 bg-white/3 px-3.5 py-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8">
                    <strong className="block truncate text-sm font-bold text-white/90">{item.title}</strong>
                    <small className="text-xs font-bold text-white/42">{item.type} · {formatDate(item.createdAt)}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function ActionButton({ href, icon: Icon, label, variant }: { href: string; icon: LucideIcon; label: string; variant?: "primary" }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black no-underline transition", variant === "primary" ? "border border-amber-500/60 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-[#17120a] shadow-lg hover:-translate-y-0.5 hover:shadow-amber-500/30" : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white")}>
      <Icon size={17} />
      {label}
    </Link>
  );
}

function MetricCard({ label, value, icon: Icon, href, accent, urgent }: { label: string; value: number | string; icon: LucideIcon; href: string; accent?: boolean; urgent?: boolean }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/8 bg-white/4 p-4 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/6">
      <Icon size={18} className={urgent ? "text-red-300" : accent ? "text-[#f3cf73]" : "text-white/55"} />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className={cn("mt-1 truncate text-2xl font-black", urgent ? "text-red-300" : accent ? "text-[#f3cf73]" : "text-[#fff7e8]")}>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
    </Link>
  );
}

function StartCard({ label, desc, href, urgent }: { label: string; desc: string; href: string; urgent?: boolean }) {
  return (
    <Link href={href} className={cn("group rounded-2xl border p-4 no-underline transition hover:-translate-y-0.5", urgent ? "border-red-400/20 bg-red-500/10" : "border-amber-400/20 bg-amber-500/10")}>
      <p className="text-sm font-black text-[#fff7e8]">{label}</p>
      <p className="mt-1 text-xs font-bold leading-6 text-white/50">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#f3cf73]">فتح <ArrowLeft className="size-3" /></span>
    </Link>
  );
}

function Panel({ title, description, href, cta, highlighted, children }: { title: string; description: string; href: string; cta: string; highlighted?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-white/4", highlighted ? "border-amber-500/20" : "border-white/8")}>
      <header className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/62 no-underline transition hover:bg-white/10 hover:text-white">
          {cta}
          <ArrowLeft className="size-3.5" />
        </Link>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function HealthRow({ label, value, bad }: { label: string; value: string; bad: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-black/15 px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-bold text-white/75">
        <span className={bad ? "size-2 rounded-full bg-red-400" : "size-2 rounded-full bg-emerald-400"} />
        {label}
      </span>
      <strong className="truncate text-xs font-black text-white/55">{value}</strong>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = status === "TRIAL" ? "تجريبي" : status === "ACTIVE" ? "نشط" : status === "EXPIRED" ? "منتهي" : status === "SUSPENDED" ? "موقوف" : status === "SUBMITTED" ? "مرسل" : status === "PENDING" ? "انتظار" : status === "UNDER_REVIEW" ? "مراجعة" : status;
  const cls = ["ACTIVE", "APPROVED"].includes(status) ? "bg-emerald-500/10 text-emerald-300" : ["EXPIRED", "SUSPENDED", "REJECTED"].includes(status) ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${cls}`}>{label}</span>;
}

function SystemMiniCard({ label, value, href, icon: Icon, danger }: { label: string; value: number; href: string; icon: LucideIcon; danger?: boolean }) {
  return (
    <Link href={href} className="rounded-xl border border-white/6 bg-black/15 p-3 no-underline transition hover:bg-white/5">
      <Icon className={danger ? "size-4 text-red-300" : "size-4 text-[#f3cf73]"} />
      <p className="mt-2 text-xs font-black text-white/38">{label}</p>
      <p className={danger ? "text-lg font-black text-red-300" : "text-lg font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-white/8 bg-white/3 px-6 py-10 text-center">
      <Icon className="mb-3 size-8 text-white/20" />
      <h3 className="text-base font-black text-white/75">{title}</h3>
      <p className="mt-1 max-w-sm text-sm font-bold leading-7 text-white/42">{description}</p>
    </div>
  );
}
