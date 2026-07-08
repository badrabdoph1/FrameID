import { prisma } from "@/lib/prisma"
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards"
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository"
import { Plus, ExternalLink, Users, Globe, CreditCard, TrendingUp, UserCheck, BarChart3, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession()

  const repository = createPrismaAdminOverviewRepository(prisma)
  const metrics = await repository.getMetrics(new Date())

  const [totalTenants, totalUsers] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
  ])

  const recentCustomers = await prisma.tenant.findMany({
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
  })

  const pendingPayments = await prisma.paymentRequest.findMany({
    where: { status: "PENDING", deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      method: true,
      createdAt: true,
      tenant: { select: { displayName: true } },
    },
  })

  const recentCustomersData = recentCustomers.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    email: c.owner.email,
    status: c.status,
    sitesCount: c._count.sites,
  }))

  const pendingPaymentsData = pendingPayments.map((p) => ({
    id: p.id,
    tenantName: p.tenant.displayName,
    amount: p.amount,
    method: p.method,
  }))

  const adminName = session.user.name
  const adminRole = session.user.role

  return (
    <div className="grid gap-5">
      {/* Hero Panel */}
      <div className="rounded-xl border border-amber-500/15 bg-gradient-to-br from-[#181b22]/98 to-[#0d0f14]/95 p-5 shadow-2xl sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[0.7rem] font-extrabold text-[#f3cf73]">
              لوحة تحكم FrameID
            </span>
            <h1 className="mt-2 text-2xl font-bold text-[#fff7e8] sm:text-3xl lg:text-4xl">
              مرحباً، {adminName}
            </h1>
            <p className="mt-1 max-w-xl text-sm font-extrabold text-white/60">
              نظرة عامة على أداء المنصة وإدارة جميع العمليات بسلاسة
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/admin/customers/new" className="inline-flex items-center gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 px-4 py-2.5 text-sm font-extrabold text-[#17120a] no-underline shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-500/30">
              <Plus size={17} />
              عميل جديد
            </Link>
            <Link href="/admin/sites" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white/80 no-underline transition hover:bg-white/10 hover:text-white">
              <ExternalLink size={17} />
              استعراض المواقع
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="إجمالي العملاء" value={totalTenants} icon={Users} href="/admin/customers" />
        <MetricCard label="المواقع النشطة" value={metrics.activeSites} icon={Globe} href="/admin/sites" />
        <MetricCard label="المستخدمين" value={totalUsers} icon={TrendingUp} href="/admin/analytics" />
        <MetricCard label="المدفوعات المعلقة" value={metrics.pendingPayments} icon={CreditCard} href="/admin/payments" accent monthlyRevenue={metrics.monthlyRevenue} currency={metrics.currency} />
      </div>

      {/* Start Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StartCard label="إضافة عميل جديد" desc="تسجيل عميل جديد في المنصة" icon={UserCheck} href="/admin/customers/new" />
        <StartCard label="عرض المواقع" desc="إدارة ومشاهدة جميع المواقع" icon={Globe} href="/admin/sites" />
        <StartCard label="الاشتراكات" desc="إدارة خطط الاشتراك" icon={CreditCard} href="/admin/subscriptions" />
        <StartCard label="التقارير" desc="تحليلات وإحصائيات المنصة" icon={BarChart3} href="/admin/analytics" />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Customers */}
        <div className="rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#fff7e8]">أحدث العملاء</h3>
            <Link href="/admin/customers" className="text-xs font-extrabold text-amber-500/70 no-underline transition hover:text-amber-400">
              عرض الكل
            </Link>
          </div>
          {recentCustomersData.length > 0 ? (
            <div className="grid gap-2">
              {recentCustomersData.map((c) => (
                <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8">
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-white/90">{c.displayName}</strong>
                    <small className="text-xs text-white/50">{c.email}</small>
                  </span>
                  <span className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-extrabold text-white/40">{c.sitesCount} مواقع</span>
                    <StatusDot status={c.status} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-white/35">لا يوجد عملاء بعد</p>
          )}
        </div>

        {/* Pending Payments */}
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/3 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#fff7e8]">المدفوعات المعلقة</h3>
            <Link href="/admin/payments" className="text-xs font-extrabold text-amber-500/70 no-underline transition hover:text-amber-400">
              عرض الكل
            </Link>
          </div>
          {pendingPaymentsData.length > 0 ? (
            <div className="grid gap-2">
              {pendingPaymentsData.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                  <span className="min-w-0">
                    <strong className="block text-sm font-semibold text-white/90">{p.tenantName}</strong>
                    <small className="text-xs text-white/50">{p.amount.toLocaleString()} ج.م · {p.method}</small>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-400">
                    <span className="size-[6px] rounded-full bg-amber-400" />
                    قيد المراجعة
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-white/35">لا توجد مدفوعات معلقة</p>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
        <p className="text-xs font-extrabold text-white/50">
          مرحباً {adminName} · صلاحياتك: <span className="text-[#f3cf73]">{adminRole}</span>
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, href, accent, monthlyRevenue, currency }: {
  label: string
  value: number
  icon: typeof Users
  href: string
  accent?: boolean
  monthlyRevenue?: number
  currency?: string
}) {
  return (
    <Link href={href} className="group rounded-xl border border-white/8 bg-white/3 p-4 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/5">
      <Icon size={18} className="text-amber-400/80" />
      <p className="mt-2 text-xs font-extrabold text-white/50">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", accent ? "text-[#f3cf73]" : "text-white")}>{value}</p>
      {accent && monthlyRevenue != null && monthlyRevenue > 0 && (
        <p className="mt-0.5 text-xs font-extrabold text-amber-500/60">↑ {monthlyRevenue.toLocaleString()} {currency} هذا الشهر</p>
      )}
    </Link>
  )
}

function StartCard({ label, desc, icon: Icon, href }: {
  label: string
  desc: string
  icon: typeof UserCheck
  href: string
}) {
  return (
    <Link href={href} className="group grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-xl border border-white/8 bg-gradient-to-br from-[#181b22]/95 to-[#0f1116]/90 p-4 no-underline shadow-lg transition hover:-translate-y-0.5 hover:border-amber-500/20 hover:from-[#1e222a]/98 hover:to-[#111319]/95">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-semibold text-[#fff7e8]">{label}</strong>
        <small className="text-xs font-extrabold text-white/50">{desc}</small>
      </span>
      <ArrowLeft size={16} className="shrink-0 text-white/40 transition group-hover:text-amber-400" />
    </Link>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-400",
    TRIAL: "bg-amber-400",
    EXPIRED: "bg-red-400",
    SUSPENDED: "bg-red-400",
  }
  return <span className={`size-2 rounded-full ${colors[status] || "bg-white/30"}`} />
}
