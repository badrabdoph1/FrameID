import { AdminPageShell } from "@/components/layout/admin-page-shell";
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
      prisma.paymentRequest.count({ where: { status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] }, deletedAt: null } }),
      prisma.supportCase.count({ where: { status: "OPEN" } }),
    ]);

  const cards = [
    { label: "المستخدمون", value: users },
    { label: "العملاء", value: tenants },
    { label: "المواقع", value: sites },
    { label: "النسخ الاحتياطي", value: backupJobs },
    { label: "المدفوعات المعلقة", value: pendingPayments },
    { label: "تذاكر الدعم المفتوحة", value: supportCases },
  ];

  return (
    <AdminPageShell
      badge="النظام"
      title="صحة النظام"
      description="فحص سريع لاتصال قاعدة البيانات وأعداد الكيانات التشغيلية الأساسية."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-sm text-white/40">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value.toLocaleString("ar-EG")}</p>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
