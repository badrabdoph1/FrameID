import { Bell, Layers3, MessageSquareText, Users } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getSupportSettings } from "@/modules/support/support-settings";
import { getSubscriptionExperienceDefaults } from "@/modules/subscription/subscription-experience";
import { SubscriptionExperienceDefaultsCard } from "@/app/(admin)/admin/messages/subscription-experience-defaults-card";
import { SubscriptionExperienceOverridesCard } from "@/app/(admin)/admin/messages/subscription-experience-overrides-card";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    defaultsSaved?: string;
    overrideSaved?: string;
    overrideCleared?: string;
    freshTrialGranted?: string;
    error?: string;
  }>;
};

function bannerText(params: Awaited<Props["searchParams"]>) {
  if (params.error) {
    return {
      tone: "danger" as const,
      text: params.error,
    };
  }
  if (params.defaultsSaved) {
    return {
      tone: "success" as const,
      text: "تم حفظ الإعدادات العامة لرسائل الاشتراك والتفعيل.",
    };
  }
  if (params.overrideSaved) {
    return {
      tone: "success" as const,
      text: `تم حفظ إعداد خاص لـ ${Number(params.overrideSaved).toLocaleString("ar-EG")} عميل.`,
    };
  }
  if (params.overrideCleared) {
    return {
      tone: "success" as const,
      text: `تمت إزالة الإعداد الخاص عن ${Number(params.overrideCleared).toLocaleString("ar-EG")} عميل.`,
    };
  }
  if (params.freshTrialGranted) {
    return {
      tone: "success" as const,
      text: `تم منح فترة تجريبية جديدة لـ ${Number(params.freshTrialGranted).toLocaleString("ar-EG")} عميل.`,
    };
  }

  return null;
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  await requireAdminPermission("messages", "view");
  const params = await searchParams;

  const [
    defaults,
    supportSettings,
    trialTenants,
    activeTenants,
    otherTenants,
    overrideRows,
  ] = await Promise.all([
    getSubscriptionExperienceDefaults(prisma),
    getSupportSettings(),
    prisma.tenant.findMany({
      where: { deletedAt: null, status: "TRIAL" },
      orderBy: { trialEndsAt: "asc" },
      take: 200,
      select: {
        id: true,
        displayName: true,
        status: true,
        owner: { select: { email: true, name: true } },
      },
    }),
    prisma.tenant.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        subscriptions: { some: { status: "ACTIVE" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        displayName: true,
        status: true,
        owner: { select: { email: true, name: true } },
      },
    }),
    prisma.tenant.findMany({
      where: {
        deletedAt: null,
        status: { in: ["TRIAL_EXPIRED", "EXPIRED", "SUSPENDED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        displayName: true,
        status: true,
        owner: { select: { email: true, name: true } },
      },
    }),
    prisma.featureFlag.findMany({
      where: {
        key: "platform.subscription.experience.override",
        scope: "TENANT",
      },
      select: { tenantId: true },
    }),
  ]);

  const overrideIds = new Set(
    overrideRows.map((row) => row.tenantId).filter(Boolean) as string[],
  );
  const toTenantOption = <
    T extends { id: string; displayName: string; status: string; owner: { email: string; name: string } },
  >(
    tenant: T,
  ) => ({
    ...tenant,
    hasOverride: overrideIds.has(tenant.id),
  });
  const banner = bannerText(params);

  return (
    <AdminPageShell
      badge="الرسائل"
      title="رسائل الاشتراك والتفعيل"
      description="هذا القسم مسؤول فقط عن كل ما يظهر للعميل داخل لوحة التحكم بخصوص الاشتراك والتفعيل والفترة التجريبية."
      breadcrumbs={[{ label: "التواصل", href: "/admin/communications" }, { label: "رسائل الاشتراك والتفعيل" }]}
      actions={[{ label: "سجل الإشعارات", href: "/admin/notifications", icon: Bell }]}
    >
      <div className="grid gap-4">
        {banner ? (
          <div
            className={
              banner.tone === "danger"
                ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
                : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"
            }
          >
            {banner.text}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-4">
          <MetricCard label="عملاء في الفترة التجريبية" value={trialTenants.length} icon={Users} />
          <MetricCard label="مشتركون نشطون" value={activeTenants.length} icon={Users} />
          <MetricCard label="إعدادات خاصة" value={overrideIds.size} icon={Layers3} />
          <MetricCard label="حالات أخرى" value={otherTenants.length} icon={MessageSquareText} />
        </section>

        <SubscriptionExperienceDefaultsCard
          defaults={defaults}
          supportWhatsapp={supportSettings.phone}
        />

        <SubscriptionExperienceOverridesCard
          defaults={defaults}
          trialTenants={trialTenants.map(toTenantOption)}
          activeTenants={activeTenants.map(toTenantOption)}
          otherTenants={otherTenants.map(toTenantOption)}
        />
      </div>
    </AdminPageShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
          <Icon className="size-4" />
        </span>
        <strong className="text-2xl font-black text-[#fff7e8]">
          {value.toLocaleString("ar-EG")}
        </strong>
      </div>
      <p className="mt-3 text-xs font-bold text-white/42">{label}</p>
    </section>
  );
}
