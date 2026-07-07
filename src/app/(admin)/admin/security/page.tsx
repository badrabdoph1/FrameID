import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { SecurityTable, type LogRow } from "@/app/(admin)/admin/security/security-table";

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

  const data: LogRow[] = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    actorEmail: l.actor?.email ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <CenterPageShell
      badge="مركز الأمان"
      title="الأمان وسجل العمليات"
      description="سجل حركة النظام وجميع العمليات."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الأمان" }]}
    >
      <SecurityTable data={data} />
    </CenterPageShell>
  );
}
