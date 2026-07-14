import { notFound } from "next/navigation";

import { PageWorkspace } from "@/components/content/page-workspace/page-workspace";
import { hasPlatformPageRenderer } from "@/components/platform-pages/platform-page-renderer";
import { getContent } from "@/lib/content";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { buildHomePageDocument } from "@/modules/platform-pages/home-page-document";
import { getPlatformPageDefinition } from "@/modules/platform-pages/page-catalog";
import { createPrismaPlatformPageRepository } from "@/modules/platform-pages/prisma-page-repository";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

type PageWorkspaceRouteProps = {
  params: Promise<{ pageKey: string }>;
};

export const dynamic = "force-dynamic";

export default async function PageWorkspaceRoute({ params }: PageWorkspaceRouteProps) {
  const { pageKey } = await params;
  const definition = getPlatformPageDefinition(pageKey);

  if (!definition || definition.availability !== "editable" || !hasPlatformPageRenderer(pageKey)) {
    notFound();
  }

  await requireAdminPermission("content", "edit");

  const legacyDocument = buildHomePageDocument(
    getContent("marketing/homepage"),
    getContent("marketing/faq"),
  );
  const repository = process.env.DATABASE_URL ? createPrismaPlatformPageRepository() : null;
  const [storedPage, revisions] = repository
    ? await Promise.all([repository.findByKey(pageKey), repository.listRevisions(pageKey)])
    : [null, []];
  const featuredTemplate = getPublishedTemplates()[0];
  const navigation = getContent("marketing/navigation");
  const footer = getContent("marketing/footer");

  return (
    <PageWorkspace
      definitionKey={pageKey}
      initialDocument={storedPage?.document ?? legacyDocument}
      initialVersion={storedPage?.version ?? 0}
      revisions={revisions.map((revision) => ({
        ...revision,
        createdAt: revision.createdAt.toISOString(),
      }))}
      siteChrome={{ navLinks: navigation.links, footer }}
      featuredTemplate={featuredTemplate
        ? {
            name: featuredTemplate.name,
            description: featuredTemplate.description,
            image: getTemplatePreviewImage(featuredTemplate),
            href: `/templates/${featuredTemplate.code}/preview`,
          }
        : null}
    />
  );
}
