import Link from "next/link";
import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

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

  type CustomerRow = {
    id: string;
    displayName: string;
    ownerName: string;
    ownerEmail: string;
    status: string;
    trialEndsAt: Date | null;
    sitesCount: number;
    paymentsCount: number;
    createdAt: Date;
  };

  const columns: Column<CustomerRow>[] = [
    {
      key: "displayName",
      header: "العميل",
      render: (r) => (
        <div>
          <p className="font-medium text-white">{r.displayName}</p>
          <p className="text-xs text-white/50">{r.ownerEmail}</p>
        </div>
      ),
      searchable: true,
    },
    {
      key: "ownerName",
      header: "المالك",
      render: (r) => r.ownerName || "—",
    },
    {
      key: "status",
      header: "الحالة",
      render: (r) => {
        const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
          ACTIVE: "success",
          TRIAL: "warning",
          EXPIRED: "danger",
          SUSPENDED: "danger",
        };
        return <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>;
      },
    },
    {
      key: "sitesCount",
      header: "المواقع",
    },
    {
      key: "paymentsCount",
      header: "المدفوعات",
    },
    {
      key: "trialEndsAt",
      header: "نهاية التجربة",
      render: (r) =>
        r.trialEndsAt
          ? r.trialEndsAt.toLocaleDateString("ar-EG")
          : "—",
    },
    {
      key: "createdAt",
      header: "تاريخ التسجيل",
      render: (r) => r.createdAt.toLocaleDateString("ar-EG"),
    },
  ];

  return (
    <CenterPageShell
      badge="إدارة العملاء"
      title="العملاء"
      description="عرض وإدارة جميع العملاء على المنصة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "العملاء" }]}
    >
      <DataTable
        columns={columns}
        data={customers.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          ownerName: c.owner.name,
          ownerEmail: c.owner.email,
          status: c.status,
          trialEndsAt: c.trialEndsAt,
          sitesCount: c._count.sites,
          paymentsCount: c._count.payments,
          createdAt: c.createdAt,
        }))}
        keyField="id"
        pageSize={20}
        onRowClick={(row) => {
          window.location.href = `/admin/customers/${row.id}`;
        }}
      />
    </CenterPageShell>
  );
}
