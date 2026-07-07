import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";
import { Users, Globe, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession();

  const repository = createPrismaAdminOverviewRepository(prisma);
  const metrics = await repository.getMetrics(new Date());

  const [totalTenants, totalUsers] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);

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
  });

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
  });

  const cards = [
    { label: "إجمالي العملاء", value: totalTenants, icon: Users, href: "/admin/customers" },
    { label: "المواقع النشطة", value: metrics.activeSites, icon: Globe, href: "/admin/sites" },
    { label: "المستخدمين", value: totalUsers, icon: TrendingUp },
    { label: "المدفوعات المعلقة", value: metrics.pendingPayments, icon: CreditCard, href: "/admin/payments" },
  ];

  return (
    <AdminPageShell
      badge="لوحة القيادة"
      title="مركز القيادة"
      description="نظرة عامة على المنصة وإدارة جميع العمليات من مكان واحد"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href ?? "#"}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/40">{card.label}</p>
                <Icon className="size-[18px] text-white/20 transition group-hover:text-champagne/60" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
              {metrics.monthlyRevenue && card.label === "المدفوعات المعلقة" && (
                <p className="mt-1 text-xs text-emerald-400">
                  ↑ {metrics.monthlyRevenue} {metrics.currency} هذا الشهر
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-medium text-white/80">أحدث العملاء</h2>
          </div>
          {recentCustomers.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {recentCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 transition hover:bg-white/[0.02]">
                  <div>
                    <Link href={`/admin/customers/${c.id}`} className="text-sm font-medium text-white/80 hover:text-champagne">
                      {c.displayName}
                    </Link>
                    <p className="text-xs text-white/35">{c.owner.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/35">{c._count.sites} مواقع</span>
                    <AdminStatusBadge tone={c.status === "ACTIVE" ? "success" : c.status === "SUSPENDED" ? "danger" : "default"}>
                      {c.status}
                    </AdminStatusBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-white/35">لا يوجد عملاء بعد</p>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-medium text-white/80">المدفوعات المعلقة</h2>
          </div>
          {pendingPayments.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white/80">{p.tenant.displayName}</p>
                    <p className="text-xs text-white/35">{p.amount} ج.م · {p.method}</p>
                  </div>
                  <AdminStatusBadge tone="warning">قيد المراجعة</AdminStatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-white/35">لا توجد مدفوعات معلقة</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <p className="text-sm text-white/40">
          مرحباً {session.user.name} · صلاحياتك: <span className="text-champagne">{session.user.role}</span>
        </p>
      </div>
    </AdminPageShell>
  );
}
