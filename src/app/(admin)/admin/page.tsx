import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { StatCard } from "@/components/admin/shared/stat-card";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  type CustomerRow = {
    id: string;
    displayName: string;
    ownerEmail: string;
    status: string;
    sitesCount: number;
    createdAt: Date;
  };

  const customerColumns: Column<CustomerRow>[] = [
    { key: "displayName", header: "العميل", searchable: true },
    { key: "ownerEmail", header: "البريد", searchable: true },
    {
      key: "status",
      header: "الحالة",
      render: (r) => (
        <Badge
          tone={
            r.status === "ACTIVE"
              ? "success"
              : r.status === "SUSPENDED"
                ? "danger"
                : r.status === "TRIAL"
                  ? "warning"
                  : "neutral"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    { key: "sitesCount", header: "المواقع" },
    {
      key: "createdAt",
      header: "التاريخ",
      render: (r) => r.createdAt.toLocaleDateString("ar-EG"),
    },
  ];

  return (
    <CenterPageShell
      badge="لوحة الإدارة العليا"
      title="مركز القيادة"
      description="نظرة عامة على المنصة وإدارة جميع العمليات من مكان واحد."
      actions={
        <Button variant="luxury" size="sm">
          تحديث البيانات
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي العملاء"
          value={totalTenants}
          href="/admin/customers"
        />
        <StatCard
          label="المواقع النشطة"
          value={metrics.activeSites}
          href="/admin/sites"
        />
        <StatCard
          label="المستخدمين"
          value={totalUsers}
        />
        <StatCard
          label="المدفوعات المعلقة"
          value={metrics.pendingPayments}
          href="/admin/payments"
          trend={{
            value: `${metrics.monthlyRevenue} ${metrics.currency} هذا الشهر`,
            positive: true,
          }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            أحدث العملاء
          </h2>
          <DataTable
            columns={customerColumns}
            data={recentCustomers.map((c) => ({
              id: c.id,
              displayName: c.displayName,
              ownerEmail: c.owner.email,
              status: c.status,
              sitesCount: c._count.sites,
              createdAt: c.createdAt,
            }))}
            keyField="id"
            pageSize={5}
            searchable={false}
          />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            المدفوعات المعلقة
          </h2>
          {pendingPayments.length > 0 ? (
            <div className="space-y-2">
              {pendingPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {p.tenant.displayName}
                    </p>
                    <p className="text-xs text-white/50">
                      {p.amount} ج.م · {p.method}
                    </p>
                  </div>
                  <span className="text-xs text-warning">قيد المراجعة</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">لا توجد مدفوعات معلقة.</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm text-white/40">
          مرحباً {session.user.name} · صلاحياتك:{" "}
          <span className="text-champagne">{session.user.role}</span>
        </p>
      </div>
    </CenterPageShell>
  );
}
