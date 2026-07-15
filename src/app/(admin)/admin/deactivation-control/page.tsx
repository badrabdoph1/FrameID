import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getDeactivationPauseStats } from "@/modules/lifecycle/customer-lifecycle";
import { DeactivationControlClient } from "@/app/(admin)/admin/deactivation-control/deactivation-control-client";

export const dynamic = "force-dynamic";

export default async function AdminDeactivationControlPage() {
  await requireAdminPermission("deactivation-control", "view");

  const stats = await getDeactivationPauseStats(prisma);

  return (
    <AdminPageShell
      title="التحكم في تعطيل الحسابات"
      description="مركز التحكم في تعليق التعطيل التلقائي للحسابات التجريبية والمدفوعة"
      badge="النظام"
    >
      <DeactivationControlClient trialStats={stats.trial} paidStats={stats.paid} />
    </AdminPageShell>
  );
}
