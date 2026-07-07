import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { StatCard } from "@/components/admin/shared/stat-card";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  await requireSuperAdminSession();

  const [users, tenants, sites, backupJobs, pendingPayments, supportCases] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.site.count({ where: { deletedAt: null } }),
      prisma.backupJob.count(),
      prisma.paymentRequest.count({
        where: { status: "PENDING", deletedAt: null },
      }),
      prisma.supportCase.count({
        where: { deletedAt: null, status: "OPEN" },
      }),
    ]);

  return (
    <CenterPageShell
      badge="صحة النظام"
      title="صحة النظام"
      description="مؤشرات أداء المنصة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الصحة" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="المستخدمون" value={users} />
        <StatCard label="العملاء" value={tenants} />
        <StatCard label="المواقع" value={sites} />
        <StatCard label="النسخ الاحتياطي" value={backupJobs} />
        <StatCard
          label="المدفوعات المعلقة"
          value={pendingPayments}
        />
        <StatCard label="تذاكر الدعم المفتوحة" value={supportCases} />
      </div>
    </CenterPageShell>
  );
}
