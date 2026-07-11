import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  await requireSuperAdminSession();

  const [trial, active, expired, pastDue] = await Promise.all([
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
  ]);

  const cards = [
    { label: "تجارب مجانية", value: trial, color: "text-sky-400" },
    { label: "نشطة", value: active, color: "text-emerald-400" },
    { label: "منتهية", value: expired, color: "text-red-400" },
    { label: "متأخرة", value: pastDue, color: "text-amber-400" },
  ];

  return (
    <AdminPageShell
      badge="الإدارة"
      title="الاشتراكات"
      description="متابعة التجارب المجانية، الاشتراكات النشطة، والحالات المتأخرة"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-sm text-white/40">{card.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
