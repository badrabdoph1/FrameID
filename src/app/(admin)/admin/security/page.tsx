import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  await requireSuperAdminSession();

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      actor: { select: { email: true, name: true } },
    },
  });

  type LogRow = {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actorEmail: string | null;
    createdAt: Date;
  };

  const columns: Column<LogRow>[] = [
    { key: "action", header: "الإجراء", searchable: true },
    { key: "entityType", header: "الكيان" },
    {
      key: "entityId",
      header: "المعرف",
      render: (r) => r.entityId ?? "—",
    },
    { key: "actorEmail", header: "المستخدم", render: (r) => r.actorEmail ?? "system" },
    {
      key: "createdAt",
      header: "التاريخ",
      render: (r) => r.createdAt.toLocaleString("ar-EG"),
    },
  ];

  return (
    <CenterPageShell
      badge="مركز الأمان"
      title="الأمان وسجل العمليات"
      description="سجل حركة النظام وجميع العمليات."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الأمان" }]}
    >
      <DataTable
        columns={columns}
        data={auditLogs.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          actorEmail: l.actor?.email ?? null,
          createdAt: l.createdAt,
        }))}
        keyField="id"
        pageSize={25}
      />
    </CenterPageShell>
  );
}
