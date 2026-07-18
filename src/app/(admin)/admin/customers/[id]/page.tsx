import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { createCustomerSubscriptionEditor } from "@/modules/admin/customers/customer-subscription-editor";
import { createPrismaCustomerSubscriptionEditorRepository } from "@/modules/admin/customers/prisma-customer-subscription-editor-repository";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getSupportSettings } from "@/modules/support/support-settings";
import {
  calcExperienceDaysRemaining,
  deriveSubscriptionExperienceState,
  getSubscriptionCardVisibilityPreference,
  getSubscriptionExperienceDefaultsRecord,
  getTenantSubscriptionExperienceOverrideRecord,
  resolveSubscriptionExperienceForBucket,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceState,
} from "@/modules/subscription/subscription-experience";
import { CustomerDetailClient } from "./customer-detail-client";
import { normalizeCustomerTab } from "./components/customer-tabs";
import type { CustomerSubscriptionVisibilityRow } from "./components/customer-subscription-visibility-card";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminCustomerDetailPage({ params, searchParams }: Props) {
  await requireAdminPermission("customers", "view");
  const { id } = await params;
  const { tab } = await searchParams;

  const repo = createCustomerAdminRepository(prisma);
  const service = createCustomerAdminService(repo);
  const subscriptionEditor = createCustomerSubscriptionEditor({
    repository: createPrismaCustomerSubscriptionEditorRepository(prisma),
  });

  const customer = await service.getCustomer(id);
  if (!customer) notFound();

  const [
    mediaResult,
    notifications,
    adminNotes,
    allSubs,
    plans,
    subscriptionDefaultsRecord,
    subscriptionOverrideRecord,
    supportSettings,
    latestPaymentRequest,
  ] = await Promise.all([
    service.getCustomerMedia(id),
    service.getCustomerNotifications(id),
    service.getCustomerAdminNotes(id),
    service.getAllSubscriptions(id),
    subscriptionEditor.listActivePlans(),
    getSubscriptionExperienceDefaultsRecord(prisma),
    getTenantSubscriptionExperienceOverrideRecord(prisma, id),
    getSupportSettings(),
    prisma.paymentRequest.findFirst({
      where: { tenantId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);
  const currentPeriodEnd =
    customer.subscription?.currentPeriodEnd ?? customer.subscription?.expiresAt ?? null;
  const currentDerived = deriveSubscriptionExperienceState({
    tenantStatus: customer.status,
    subscriptionStatus: customer.subscription?.status ?? null,
    trialEndsAt: customer.trialEndsAt ? new Date(customer.trialEndsAt) : null,
    subscriptionEndsAt: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
    latestPaymentRequestStatus: latestPaymentRequest?.status ?? null,
  });
  const previewStateByBucket: Record<SubscriptionExperienceBucket, SubscriptionExperienceState> = {
    trial: "trial",
    active: "active",
    pendingReview: "pending-review",
    rejected: "rejected",
    expired: "expired",
  };
  const subscriptionVisibilityStates: CustomerSubscriptionVisibilityRow[] =
    subscriptionExperienceBucketDefinitions.map((definition) => {
      const bucketOverride = subscriptionOverrideRecord?.override[definition.value];
      const daysRemaining =
        definition.value === "active"
          ? calcExperienceDaysRemaining(
              currentPeriodEnd ? new Date(currentPeriodEnd) : null,
            )
          : definition.value === "expired"
            ? 0
            : calcExperienceDaysRemaining(
                customer.trialEndsAt ? new Date(customer.trialEndsAt) : null,
              );
      return {
        bucket: definition.value,
        label: definition.label,
        description: definition.description,
        isCurrent: currentDerived.bucket === definition.value,
        preference: getSubscriptionCardVisibilityPreference(bucketOverride),
        experience: resolveSubscriptionExperienceForBucket({
          defaults: subscriptionDefaultsRecord.defaults,
          override: subscriptionOverrideRecord?.override,
          bucket: definition.value,
          state: previewStateByBucket[definition.value],
          daysRemaining,
          supportWhatsappNumber: supportSettings.phone,
          sourceFallbackUsed: subscriptionDefaultsRecord.sourceFallbackUsed,
        }),
        lastUpdatedAt:
          bucketOverride?.metadata?.updatedAt ??
          (bucketOverride && subscriptionOverrideRecord
            ? subscriptionOverrideRecord.updatedAt.toISOString()
            : null),
        lastUpdatedBy: bucketOverride?.metadata?.updatedByAdminName ?? null,
      };
    });
  const statusLabel = {
    ACTIVE: "نشط",
    TRIAL: "تجريبي",
    SUSPENDED: "موقوف",
    EXPIRED: "منتهي",
    TRIAL_EXPIRED: "انتهت التجربة",
    ARCHIVED: "مؤرشف",
  }[customer.status];

  return (
    <AdminPageShell
      badge={`حالة الحساب: ${statusLabel}`}
      title={customer.displayName}
      description={`${customer.owner.email}`}
      backHref="/admin/customers"
      backLabel="العملاء"
      actions={[{ label: "العملاء", href: "/admin/customers" }]}
    >
      <CustomerDetailClient
        initialTab={normalizeCustomerTab(tab)}
        customer={customer}
        platformBaseUrl={getPlatformBaseUrl()}
        media={mediaResult.assets}
        notifications={notifications}
        adminNotes={adminNotes}
        allSubscriptions={allSubs}
        plans={plans}
        subscriptionVisibilityStates={subscriptionVisibilityStates}
        hasSubscriptionExperienceOverride={Boolean(subscriptionOverrideRecord)}
      />
    </AdminPageShell>
  );
}
