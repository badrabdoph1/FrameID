import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { StatCard } from "@/components/admin/shared/stat-card";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  await requireSuperAdminSession();

  const [trial, active, expired, pastDue] = await Promise.all([
    prisma.subscription.count({ where: { status: "TRIAL", deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.subscription.count({ where: { status: "EXPIRED", deletedAt: null } }),
    prisma.subscription.count({ where: { status: "PAST_DUE", deletedAt: null } })
  ]);

  return (
    <CenterPageShell
      badge="إدارة الاشتراكات"
      title="الاشتراكات"
      description="متابعة التجارب المجانية، الاشتراكات النشطة، والحالات المتأخرة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الاشتراكات" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="تجارب مجانية" value={trial} />
        <StatCard label="نشطة" value={active} />
        <StatCard label="منتهية" value={expired} />
        <StatCard label="متأخرة" value={pastDue} />
      </div>
    </CenterPageShell>
  );
}
