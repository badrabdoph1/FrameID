import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { prisma } from "@/lib/prisma";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { PublishClient } from "@/app/(dashboard)/dashboard/publish/publish-client";

export const metadata: Metadata = {
  title: "النشر والمشاركة | FrameID"
};

export const dynamic = "force-dynamic";

type PublishPageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export default async function DashboardPublishPage({
  searchParams
}: PublishPageProps) {
  const session = await getCurrentRequestSession();
  const { updated, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const [seo, site, packagesCount, imagesCount, contactProfile] = await Promise.all([
    prisma.sEOSettings.findUnique({
      where: { siteId: session.site.id }
    }),
    prisma.site.findUnique({
      where: { id: session.site.id },
      select: { status: true, isPublished: true, publishedVersion: true },
    }),
    prisma.package.count({ where: { siteId: session.site.id, deletedAt: null } }),
    prisma.galleryImage.count({
      where: {
        deletedAt: null,
        album: { siteId: session.site.id, deletedAt: null },
        asset: { deletedAt: null },
      },
    }),
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      select: { phone: true, whatsapp: true, email: true },
    }),
  ]);

  let ogImageUrl: string | null = null;
  if (seo?.ogAssetId) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: seo.ogAssetId },
      select: { url: true }
    });
    ogImageUrl = asset?.url ?? null;
  }

  const siteUrl = `${getPlatformBaseUrl()}/p/${session.site.slug}`;
  const hasContact = Boolean(contactProfile?.phone || contactProfile?.whatsapp || contactProfile?.email);
  const hasPortfolio = imagesCount > 0;
  const hasPackages = packagesCount > 0;
  const hasSeo = Boolean(seo?.title && (seo.description || seo.ogAssetId));
  const readinessItems = [
    { id: "contact", label: "بيانات تواصل قابلة للحجز", done: hasContact, href: "/dashboard/site-info" },
    { id: "portfolio", label: "معرض أعمال يحتوي صور", done: hasPortfolio, href: "/dashboard/gallery" },
    { id: "packages", label: "باقة واحدة على الأقل", done: hasPackages, href: "/dashboard/services" },
    { id: "seo", label: "عنوان ووصف أو صورة مشاركة", done: hasSeo, href: "/dashboard/publish" },
  ];
  const canPublish = readinessItems.every((item) => item.done);

  return (
    <PublishClient
      siteTitle={session.site.title}
      siteUrl={siteUrl}
      seoTitle={seo?.title ?? null}
      seoDescription={seo?.description ?? null}
      ogImageUrl={ogImageUrl}
      robotsIndex={seo?.robotsIndex ?? true}
      canonicalUrl={seo?.canonicalUrl ?? null}
      updated={updated}
      error={error}
      isPublished={site?.status === "PUBLISHED" || site?.isPublished === true}
      publishedVersion={site?.publishedVersion ?? 0}
      readinessItems={readinessItems}
      canPublish={canPublish}
    />
  );
}
