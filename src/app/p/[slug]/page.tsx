import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
import { MissingContactGuard } from "@/components/themes/missing-contact-guard";
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

async function getPublicSite(slug: string) {
  const repository = createPrismaPublicSiteRepository(prisma);
  const [site, platformSocialPreview] = await Promise.all([
    repository.findBySlug(slug),
    loadPlatformSocialPreview(),
  ]);

  if (!site || site.status !== "PUBLISHED") return null;

  return createPublicSiteViewModel({
    site,
    platformBaseUrl: getPlatformBaseUrl(),
    platformSocialImageUrl: resolvePlatformSocialImage(platformSocialPreview),
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) {
    return {
      title: "الموقع غير موجود",
      robots: { index: false, follow: false },
    };
  }

  return site.metadata;
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) notFound();

  const { result: access } = await checkSiteAccessBySlug(slug);
  if (!access.allowed) {
    const session = await getCurrentRequestSession();
    const isOwner = session?.site.slug === slug;
    return <SiteExpiredPage isOwner={isOwner} />;
  }

  const ThemeSiteComponent = getThemeSiteComponent(site.themeCode);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(site.structuredData) }}
      />
      <ThemeSiteComponent site={site} />
      <MissingContactGuard />
    </>
  );
}
