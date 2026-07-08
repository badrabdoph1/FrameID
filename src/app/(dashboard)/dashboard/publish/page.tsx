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

  const seo = await prisma.sEOSettings.findUnique({
    where: { siteId: session.site.id }
  });

  let ogImageUrl: string | null = null;
  if (seo?.ogAssetId) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: seo.ogAssetId },
      select: { url: true }
    });
    ogImageUrl = asset?.url ?? null;
  }

  const siteUrl = `${getPlatformBaseUrl()}/p/${session.site.slug}`;

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
    />
  );
}
