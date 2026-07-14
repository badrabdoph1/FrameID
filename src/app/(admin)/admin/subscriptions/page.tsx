import Link from "next/link";
import { BadgeCheck, Clock3 } from "lucide-react";

import { AdminEmptyState, AdminStatusBadge } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

const statusMeta = {
  TRIAL: { label: "تجربة مجانية", tone: "warning" as const },
  ACTIVE: { label: "نشط", tone: "success" as const },
  EXPIRED: { label: "منتهي", tone: "danger" as const },
  PAST_DUE: { label: "متأخر", tone: "danger" as const },
  CANCELLED: { label: "ملغي", tone: "neutral" as const },
  SUSPENDED: { label: "موقوف", tone: "warning" as const },
};

type SubscriptionStatus = keyof typeof statusMeta;
type Props = { searchParams: Promise<{ status?: string }> };

function normalizeStatus(value?: string): SubscriptionStatus | undefined {
  return value && value in statusMeta ? value as SubscriptionStatus : undefined;
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(value) : "غير محدد";
}

export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  await requireAdminPermission("subscriptions", "view");
  const status = normalizeStatus((await searchParams).status);

  const [groups, subscriptions] = await Promise.all([
    prisma.subscription.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
    prisma.subscription.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: [{ currentPeriodEnd: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        expiresAt: true,
        tenant: { select: { id: true, displayName: true, owner: { select: { email: true } } } },
        plan: { select: { name: true } },
      },
    }),
  ]);
  const counts = new Map(groups.map((item) => [item.status, item._count._all]));
  const summary: SubscriptionStatus[] = ["ACTIVE", "TRIAL", "PAST_DUE", "EXPIRED"];

  return (
    <AdminPageShell
      badge="المال"
      title="الاشتراكات"
      description="تابع حالة كل اشتراك وافتح ملف العميل عند الحاجة إلى قرار أو متابعة."
      breadcrumbs={[{ label: "المال", href: "/admin/billing" }, { label: "الاشتراكات" }]}
    >
      <nav aria-label="تصفية الاشتراكات" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Link key={item} href={`/admin/subscriptions?status=${item}`} aria-current={status === item ? "page" : undefined} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/25 aria-[current=page]:border-amber-300/35 aria-[current=page]:bg-amber-300/8">
            <span className="text-xs font-black text-white/45">{statusMeta[item].label}</span>
            <strong className="mt-2 block text-2xl font-black text-[#fff7e8]">{(counts.get(item) ?? 0).toLocaleString("ar-EG")}</strong>
          </Link>
        ))}
      </nav>

      <section aria-label="قائمة الاشتراكات" className="grid gap-3">
        {subscriptions.length === 0 ? (
          <AdminEmptyState title="لا توجد اشتراكات في هذه الحالة" description="اختر حالة أخرى من البطاقات بالأعلى لعرض بقية الاشتراكات." icon={BadgeCheck} />
        ) : subscriptions.map((subscription) => {
          const meta = statusMeta[subscription.status];
          const endDate = subscription.expiresAt ?? subscription.currentPeriodEnd;
          return (
            <article key={subscription.id} className="grid gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-black text-[#fff7e8]">{subscription.tenant.displayName}</h2>
                  <AdminStatusBadge label={meta.label} tone={meta.tone} />
                </div>
                <p className="mt-1 text-sm font-bold text-white/48">{subscription.plan?.name ?? "بدون باقة"}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white/38"><Clock3 className="size-3.5" /> الانتهاء: {formatDate(endDate)} · {subscription.tenant.owner.email}</p>
              </div>
              <Link href={`/admin/customers/${subscription.tenant.id}?tab=subscription`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline">فتح العميل</Link>
            </article>
          );
        })}
      </section>
    </AdminPageShell>
  );
}
