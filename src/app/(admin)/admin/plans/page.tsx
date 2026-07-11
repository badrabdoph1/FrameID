import { CreditCard, Search } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { PlansManagerClient } from "@/app/(admin)/admin/plans/plans-manager-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; state?: string; saved?: string; toggled?: string; archived?: string; error?: string }>;
};

export default async function AdminPlansPage({ searchParams }: Props) {
  await requireAdminPermission("plans", "view");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const state = (params.state ?? "").trim();

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    where.OR = [{ code: contains }, { name: contains }, { currency: contains }, { billingInterval: contains }];
  }
  if (state === "active") where.isActive = true;
  if (state === "inactive") where.isActive = false;

  const [plans, totalPlans, activePlans, subscriptionCount, paymentCount] = await Promise.all([
    prisma.plan.findMany({
      where: where as never,
      orderBy: [{ isActive: "desc" }, { priceAmount: "asc" }],
      include: { _count: { select: { subscriptions: true, paymentRequests: true } } },
    }),
    prisma.plan.count({ where: { deletedAt: null } }),
    prisma.plan.count({ where: { deletedAt: null, isActive: true } }),
    prisma.subscription.count({ where: {} }),
    prisma.paymentRequest.count({ where: { deletedAt: null } }),
  ]);

  const banner = params.error
    ? { tone: "danger" as const, text: decodeURIComponent(params.error) }
    : params.saved
      ? { tone: "success" as const, text: "تم حفظ الباقة بنجاح." }
      : params.toggled
        ? { tone: "success" as const, text: "تم تغيير ظهور الباقة." }
        : params.archived
          ? { tone: "success" as const, text: "تم أرشفة الباقة." }
          : null;

  return (
    <AdminPageShell
      badge="المال"
      title="إدارة الباقات"
      description="إدارة مرئية بسيطة للباقات كما تظهر للعميل: الاسم، السعر، الشارة، الوصف، وسطور المميزات بدون أي أكواد."
      breadcrumbs={[{ label: "المال", href: "/admin/billing" }, { label: "الباقات" }]}
      actions={[{ label: "المدفوعات", href: "/admin/payments", icon: CreditCard }, { label: "البحث", href: "/admin/search", icon: Search }]}
    >
      <PlansManagerClient
        plans={plans.map((plan) => ({
          id: plan.id,
          code: plan.code,
          name: plan.name,
          priceAmount: plan.priceAmount,
          currency: plan.currency,
          billingInterval: plan.billingInterval,
          features: plan.features,
          isActive: plan.isActive,
          _count: plan._count,
        }))}
        metrics={{ totalPlans, activePlans, subscriptionCount, paymentCount }}
        banner={banner}
      />
    </AdminPageShell>
  );
}
