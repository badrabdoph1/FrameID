import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardHomeClient } from "./home-client";
import { prisma } from "@/lib/prisma";
import { hasMeaningfulContactInfo } from "@/modules/dashboard/contact-completion";

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
  ]);

  const lastModified = siteTheme?.updatedAt ?? new Date()

  const dashboard = createDashboardViewModel({
    session,
    platformBaseUrl: getPlatformBaseUrl(),
    now: new Date(),
    packagesCount,
    imagesCount,
    albumsCount,
    hasContactInfo: hasMeaningfulContactInfo(contactProfile),
    hasCoverImage: !!(heroSection?.data && typeof heroSection.data === "object" && "imageUrl" in heroSection.data),
    currentThemeName: siteTheme?.theme.name ?? "بدون",
    lastModifiedAt: lastModified,
  });

  return <DashboardHomeClient {...dashboard} />;
}
