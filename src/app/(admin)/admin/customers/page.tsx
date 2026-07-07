import Link from "next/link";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
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
    <AdminPageShell
      badge="الإدارة"
      title="العملاء"
      description="عرض وإدارة جميع العملاء على المنصة"
      actions={[
        { label: "إنشاء عميل", variant: "primary" },
        { label: "تصدير", variant: "secondary" },
      ]}
    >
      <CustomersTable data={data} />
    </AdminPageShell>
  );
}
