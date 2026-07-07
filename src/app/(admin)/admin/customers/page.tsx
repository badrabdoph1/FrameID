import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { CustomersTable, type CustomerRow } from "@/app/(admin)/admin/customers/customers-table";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireSuperAdminSession();

  const customers = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      displayName: true,
      status: true,
      trialEndsAt: true,
      createdAt: true,
      owner: { select: { email: true, name: true } },
      _count: {
        select: {
          sites: true,
          subscriptions: true,
          payments: true,
        },
      },
    },
  });

  const data: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    ownerName: c.owner.name,
    ownerEmail: c.owner.email,
    status: c.status,
    trialEndsAt: c.trialEndsAt?.toISOString() ?? null,
    sitesCount: c._count.sites,
    paymentsCount: c._count.payments,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <CenterPageShell
      badge="إدارة العملاء"
      title="العملاء"
      description="عرض وإدارة جميع العملاء على المنصة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "العملاء" }]}
    >
      <CustomersTable data={data} />
    </CenterPageShell>
  );
}
