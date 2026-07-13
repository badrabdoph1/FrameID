import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardHomeClient } from "./home-client";
import { prisma } from "@/lib/prisma";
import { hasMeaningfulContactInfo } from "@/modules/dashboard/contact-completion";
import {
  CUSTOMER_BROADCAST_CATEGORY,
  validateMessageTone,
} from "@/modules/messages/customer-message-config";
import {
  getSubscriptionExperienceDefaults,
  getTenantSubscriptionExperienceOverride,
  resolveSubscriptionExperience,
} from "@/modules/subscription/subscription-experience";
import { getSupportSettings } from "@/modules/support/support-settings";

export const metadata: Metadata = {
  title: "لوحة التحكم | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

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
    subscriptionExperienceDefaults,
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
    prisma.notificationLog.findMany({
      where: {
        tenantId: session.tenant.id,
        category: CUSTOMER_BROADCAST_CATEGORY,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, type: true, title: true, body: true, createdAt: true },
    }),
    getSubscriptionExperienceDefaults(prisma),
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
          defaults: subscriptionExperienceDefaults,
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
    customerMessages: customerMessages.map((message) => ({
      id: message.id,
      tone: validateMessageTone(message.type),
      title: message.title,
      body: message.body ?? "",
      createdAt: message.createdAt.toISOString(),
    })),
    subscriptionExperience,
    heroImageUrl,
  });

  return <DashboardHomeClient {...dashboard} />;
}
