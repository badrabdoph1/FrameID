import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
import { MissingContactGuard } from "@/components/themes/missing-contact-guard";
import { SiteDeletedExperience } from "@/components/errors/site-deleted-experience";
import { prisma } from "@/lib/prisma";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaPublicSiteRepository } from "@/modules/public-sites/prisma-public-site-repository";
import { createPublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import {
  loadPlatformSocialPreview,
  resolvePlatformSocialImage,
} from "@/modules/seo/platform-social-preview";
import { checkSiteAccessBySlug } from "@/modules/subscription/subscription-access";
import { SiteExpiredPage } from "@/components/site-expired-page";

type Props = {
  params: Promise<{ slug: string }>;
};

type SiteResult =
  | { status: "found"; site: NonNullable<ReturnType<typeof createPublicSiteViewModel>> }
  | { status: "deleted" }
  | { status: "not_found" };

async function getPublicSite(slug: string): Promise<SiteResult> {
  const repository = createPrismaPublicSiteRepository(prisma);
  const [site, platformSocialPreview, isDeleted] = await Promise.all([
    repository.findBySlug(slug),
    loadPlatformSocialPreview(),
    repository.isDeletedBySlug(slug),
  ]);

  if (!site && isDeleted) return { status: "deleted" };
  if (!site || site.status !== "PUBLISHED") return { status: "not_found" };

  return {
    status: "found",
    site: createPublicSiteViewModel({
      site,
      platformBaseUrl: getPlatformBaseUrl(),
      platformSocialImageUrl: resolvePlatformSocialImage(platformSocialPreview),
    }),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicSite(slug);

  if (result.status === "found") {
    return result.site.metadata;
  }

  return {
    title: result.status === "deleted" ? "تم حذف الموقع" : "الموقع غير موجود",
    robots: { index: false, follow: false },
  };
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublicSite(slug);

  if (result.status === "deleted") {
    return <SiteDeletedExperience />;
  }

  if (result.status === "not_found") notFound();

  const { result: access } = await checkSiteAccessBySlug(slug);
  if (!access.allowed) {
    const session = await getCurrentRequestSession();
    const isOwner = session?.site.slug === slug;
    return <SiteExpiredPage isOwner={isOwner} />;
  }

  const ThemeSiteComponent = getThemeSiteComponent(result.site.themeCode);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(result.site.structuredData) }}
      />
      <ThemeSiteComponent site={result.site} />
      <MissingContactGuard />
    </>
  );
}
