import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardHomeClient } from "./home-client";
import { prisma } from "@/lib/prisma";
import { hasMeaningfulContactInfo } from "@/modules/dashboard/contact-completion";
import { validateMessageTone } from "@/modules/messages/customer-message-config";
import {
  getSubscriptionExperienceDefaultsRecord,
  getTenantSubscriptionExperienceOverride,
  resolveSubscriptionExperience,
} from "@/modules/subscription/subscription-experience";
import { getSupportSettings } from "@/modules/support/support-settings";

export const metadata: Metadata = {
  title: "لوحة التحكم | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const showWelcome = params.welcome === "1";

  const [
    packagesCount,
    imagesCount,
    albumsCount,
    contactProfile,
    heroSection,
    siteTheme,
    latestPaymentRequest,
    seoSettings,
    customerMessages,
    subscriptionExperienceDefaultsRecord,
    subscriptionExperienceOverride,
    supportSettings,
  ] = await Promise.all([
    prisma.package.count({ where: { siteId: session.site.id, deletedAt: null } }),
    prisma.galleryImage.count({
      where: {
        deletedAt: null,
        album: { siteId: session.site.id, deletedAt: null },
        asset: { deletedAt: null },
      },
    }),
    prisma.galleryAlbum.count({ where: { siteId: session.site.id, deletedAt: null } }),
    prisma.contactProfile.findUnique({ where: { siteId: session.site.id } }),
    prisma.siteSection.findFirst({
      where: { siteId: session.site.id, type: "hero", deletedAt: null },
    }),
    prisma.site.findUnique({
      where: { id: session.site.id },
      select: { theme: { select: { name: true } }, updatedAt: true },
    }),
    prisma.paymentRequest.findFirst({
      where: {
        tenantId: session.tenant.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
    prisma.sEOSettings.findUnique({
      where: { siteId: session.site.id },
      select: { title: true, description: true, ogAssetId: true },
    }),
    prisma.customerMessageRecipient.findMany({
      where: {
        tenantId: session.tenant.id,
        campaign: { status: "ACTIVE" },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        campaign: {
          select: { id: true, tone: true, title: true, body: true, createdAt: true },
        },
      },
    }),
    getSubscriptionExperienceDefaultsRecord(prisma),
    getTenantSubscriptionExperienceOverride(prisma, session.tenant.id),
    getSupportSettings(),
  ]);

  const lastModified = siteTheme?.updatedAt ?? new Date();
  const hasSeoSettings = Boolean(seoSettings?.title && (seoSettings.description || seoSettings.ogAssetId));
  const hasHeroCover = !!(heroSection?.data && typeof heroSection.data === "object" && "imageUrl" in heroSection.data);
  const heroImageUrl = hasHeroCover && heroSection?.data && typeof heroSection.data === "object" && "imageUrl" in heroSection.data
    ? (heroSection.data as { imageUrl: string }).imageUrl
    : null;
  const subscriptionEndsAt =
    session.subscription?.currentPeriodEnd ?? session.subscription?.expiresAt ?? null;
  const subscriptionExperience =
    session.subscription || session.tenant.status !== "ACTIVE"
      ? resolveSubscriptionExperience({
          defaults: subscriptionExperienceDefaultsRecord.defaults,
          override: subscriptionExperienceOverride,
          context: {
            tenantStatus: session.tenant.status,
            subscriptionStatus: session.subscription?.status ?? null,
            trialEndsAt: session.tenant.trialEndsAt,
            subscriptionEndsAt,
            latestPaymentRequestStatus: latestPaymentRequest?.status ?? null,
            supportWhatsappNumber: supportSettings.phone,
          },
          now: new Date(),
          sourceFallbackUsed:
            subscriptionExperienceDefaultsRecord.sourceFallbackUsed,
        })
      : null;

  const dashboard = createDashboardViewModel({
    session,
    platformBaseUrl: getPlatformBaseUrl(),
    now: new Date(),
    packagesCount,
    imagesCount,
    albumsCount,
    hasContactInfo: hasMeaningfulContactInfo(contactProfile),
    hasCoverImage: Boolean(contactProfile?.coverAssetId) || hasHeroCover,
    hasAvatarImage: Boolean(contactProfile?.avatarAssetId),
    currentThemeName: siteTheme?.theme.name ?? "بدون",
    lastModifiedAt: lastModified,
    pendingRequestStatus: ["SUBMITTED", "PENDING", "UNDER_REVIEW"].includes(latestPaymentRequest?.status ?? "") ? latestPaymentRequest?.status ?? null : null,
    latestPaymentRequestStatus: latestPaymentRequest?.status ?? null,
    hasSeoSettings,
    customerMessages: customerMessages.map(({ campaign }) => ({
      id: campaign.id,
      tone: validateMessageTone(campaign.tone),
      title: campaign.title,
      body: campaign.body,
      createdAt: campaign.createdAt.toISOString(),
    })),
    subscriptionExperience,
    heroImageUrl,
    siteSuspended: session.tenant.status === "SUSPENDED" || session.site.status === "SUSPENDED" || session.subscription?.status === "SUSPENDED",
  });

  return <DashboardHomeClient {...dashboard} showWelcome={showWelcome} />;
}
