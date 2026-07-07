import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { SupportTable, type CaseRow } from "@/app/(admin)/admin/support/support-table";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireSuperAdminSession();

  const cases = await prisma.supportCase.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      tenant: { select: { displayName: true } },
    },
  });

  const data: CaseRow[] = cases.map((c) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    priority: c.priority,
    tenantName: c.tenant.displayName,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <CenterPageShell
      badge="مركز الدعم"
      title="الدعم"
      description="تذاكر الدعم واستفسارات العملاء."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الدعم" }]}
    >
      <SupportTable data={data} />
    </CenterPageShell>
  );
}
