import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentEditorClient } from "@/app/(dashboard)/dashboard/content/content-editor-client";
import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";
import { createSiteContentService } from "@/modules/content/site-content-service";

export const metadata: Metadata = { title: "محتوى الموقع | FrameID" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const [content, profile] = await Promise.all([
    createSiteContentService({
      repository: createPrismaSiteContentRepository(prisma),
    }).getEditorContent({ session }),
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      select: { coverAsset: { select: { url: true } } },
    }),
  ]);

  return (
    <ContentEditorClient
      sections={content.sections}
      coverUrl={profile?.coverAsset?.url ?? null}
    />
  );
}
