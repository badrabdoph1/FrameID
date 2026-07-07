import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

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

  type CaseRow = {
    id: string;
    subject: string;
    status: string;
    priority: string;
    tenantName: string;
    createdAt: Date;
  };

  const columns: Column<CaseRow>[] = [
    {
      key: "subject",
      header: "الموضوع",
      render: (r) => (
        <div>
          <p className="font-medium text-white">{r.subject}</p>
          <p className="text-xs text-white/50">{r.tenantName}</p>
        </div>
      ),
      searchable: true,
    },
    {
      key: "status",
      header: "الحالة",
      render: (r) => {
        const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
          OPEN: "warning",
          PENDING_CUSTOMER: "neutral",
          RESOLVED: "success",
          CLOSED: "neutral",
        };
        return <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>;
      },
    },
    {
      key: "priority",
      header: "الأولوية",
      render: (r) => {
        const toneMap: Record<string, "danger" | "warning" | "neutral"> = {
          urgent: "danger",
          high: "warning",
          normal: "neutral",
          low: "neutral",
        };
        return <Badge tone={toneMap[r.priority] || "neutral"}>{r.priority}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "التاريخ",
      render: (r) => r.createdAt.toLocaleDateString("ar-EG"),
    },
  ];

  return (
    <CenterPageShell
      badge="مركز الدعم"
      title="الدعم"
      description="تذاكر الدعم واستفسارات العملاء."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الدعم" }]}
    >
      <DataTable
        columns={columns}
        data={cases.map((c) => ({
          id: c.id,
          subject: c.subject,
          status: c.status,
          priority: c.priority,
          tenantName: c.tenant.displayName,
          createdAt: c.createdAt,
        }))}
        keyField="id"
        pageSize={20}
        emptyMessage="لا توجد تذاكر دعم."
      />
    </CenterPageShell>
  );
}
