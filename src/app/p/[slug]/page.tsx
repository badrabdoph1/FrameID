import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
import { prisma } from "@/lib/prisma";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { createPrismaPublicSiteRepository } from "@/modules/public-sites/prisma-public-site-repository";
import { createPublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPublicSite(slug: string) {
  const repository = createPrismaPublicSiteRepository(prisma);
  const site = await repository.findBySlug(slug);

  if (!site || site.status !== "PUBLISHED") {
    return null;
  }

  return createPublicSiteViewModel({
    site,
    platformBaseUrl: getPlatformBaseUrl()
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) {
    return {
      title: "الموقع غير موجود"
    };
  }

  return site.metadata;
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) {
    notFound();
  }

  const ThemeSiteComponent = getThemeSiteComponent(site.themeCode);

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(site.structuredData)
        }}
      />
      <ThemeSiteComponent site={site} />
    </>
  );
}
