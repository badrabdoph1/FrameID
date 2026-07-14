import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { SupportTable, type CaseRow } from "@/app/(admin)/admin/support/support-table";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireAdminPermission("support", "view");

  const cases = await prisma.supportCase.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      tenant: { select: { id: true, displayName: true } },
    },
  });

  const data: CaseRow[] = cases.map((c) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    tenantName: c.tenant.displayName,
    tenantId: c.tenant.id,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AdminPageShell
      badge="التواصل"
      title="حالات الدعم"
      description="تابع طلبات العملاء وافتح ملف العميل للحصول على السياق الكامل."
      breadcrumbs={[{ label: "التواصل", href: "/admin/communications" }, { label: "الدعم" }]}
    >
      <SupportTable data={data} />
    </AdminPageShell>
  );
}
