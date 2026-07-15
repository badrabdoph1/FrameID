import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";
import { createPaymentSettingsService } from "@/modules/billing/payment-settings-service";
import { createPrismaPaymentSettingsRepository } from "@/modules/billing/prisma-payment-settings-repository";
import { getSupportSettings } from "@/modules/support/support-settings";
import {
  getSubscriptionExperienceDefaults,
  getTenantSubscriptionExperienceOverride,
  resolveSubscriptionExperience,
} from "@/modules/subscription/subscription-experience";
import { BillingClient } from "@/app/(dashboard)/dashboard/billing/billing-client";

export const metadata: Metadata = {
  title: "تفعيل الاشتراك | FrameID",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

function getDaysRemaining(trialEndsAt: Date): number {
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getCurrentRequestSession();
  const sp = await searchParams;

  if (!session) redirect("/login");

  // Allow null subscription — the billing page handles it by showing the activation flow

  const [plans, paymentRequest, paymentMethods, defaults, override, supportSettings] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { priceAmount: "asc" }],
    }),
    createBillingActivationService({
      repository: createPrismaBillingActivationRepository(prisma),
    }).getCustomerActivePaymentRequest(session.tenant.id),
    createPaymentSettingsService(
      createPrismaPaymentSettingsRepository(prisma as never),
    ).getActivePaymentMethods(),
    getSubscriptionExperienceDefaults(prisma),
    getTenantSubscriptionExperienceOverride(prisma, session.tenant.id),
    getSupportSettings(),
  ]);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenant.id },
    select: {
      id: true,
      trialStartedAt: true,
      trialEndsAt: true,
      trialDays: true,
      gracePeriodEndsAt: true,
    },
  });

  let logs: Array<{ id: string; action: string; actorName: string | null; metadata: unknown; createdAt: Date }> = [];

  let proofUrl: string | null = null;

  if (paymentRequest) {
    logs = await prisma.paymentRequestLog.findMany({
      where: { paymentRequestId: paymentRequest.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, action: true, actorName: true, metadata: true, createdAt: true },
    });

    if (paymentRequest.proofAssetId) {
      const asset = await prisma.mediaAsset.findUnique({
        where: { id: paymentRequest.proofAssetId },
        select: { url: true },
      });
      proofUrl = asset?.url ?? null;
    }
  }

  const subscriptionExperience = resolveSubscriptionExperience({
    defaults,
    override,
    context: {
      tenantStatus: session.tenant.status,
      subscriptionStatus: session.subscription?.status ?? null,
      trialEndsAt: tenant?.trialEndsAt ?? null,
      subscriptionEndsAt:
        session.subscription?.currentPeriodEnd ??
        session.subscription?.expiresAt ??
        null,
      latestPaymentRequestStatus: paymentRequest?.status ?? null,
      supportWhatsappNumber: supportSettings.phone,
    },
    now: new Date(),
  });

  return (
    <BillingClient
      session={{
        user: session.user,
        tenant: {
          id: session.tenant.id,
          displayName: session.tenant.displayName,
          status: session.tenant.status,
          trialEndsAt: tenant?.trialEndsAt ?? session.tenant.trialEndsAt ?? new Date(),
          trialStartedAt: tenant?.trialStartedAt ?? session.tenant.trialStartedAt ?? new Date(),
          trialDays: tenant?.trialDays ?? session.tenant.trialDays ?? 14,
          gracePeriodEndsAt: tenant?.gracePeriodEndsAt ?? session.tenant.gracePeriodEndsAt ?? null,
        },
        site: session.site ?? { id: "", slug: "", title: "", status: "DRAFT", slugChangeUsed: false },
        subscription: session.subscription,
      }}
      plans={plans.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        priceAmount: p.priceAmount,
        currency: p.currency,
        billingInterval: p.billingInterval,
        features: p.features,
        isActive: p.isActive,
      }))}
      paymentMethods={paymentMethods}
      paymentRequest={paymentRequest ? {
        id: paymentRequest.id,
        status: paymentRequest.status,
        method: paymentRequest.method,
        paymentAccountId: paymentRequest.paymentAccountId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        reference: paymentRequest.reference,
        proofAssetId: paymentRequest.proofAssetId,
        proofUrl,
        planId: paymentRequest.planId,
        submittedAt: paymentRequest.submittedAt,
        rejectionReason: paymentRequest.rejectionReason,
      } : null}
      logs={logs}
      daysRemaining={tenant ? getDaysRemaining(tenant.trialEndsAt) : 0}
      subscriptionExperience={subscriptionExperience}
      requested={sp.requested === "1"}
      draftId={sp.draft}
      error={sp.error}
    />
  );
}
