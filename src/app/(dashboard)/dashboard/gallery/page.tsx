import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { GalleryClient } from "@/app/(dashboard)/dashboard/gallery/gallery-client";

export const metadata: Metadata = {
  title: "الصور | FrameID"
};

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  searchParams: Promise<{
    albumId?: string;
    uploaded?: string;
    error?: string;
    created?: string;
    deleted?: string;
    renamed?: string;
    coverSet?: string;
    featuredToggled?: string;
    reordered?: string;
  }>;
};

export default async function DashboardGalleryPage({
  searchParams
}: GalleryPageProps) {
  const session = await getCurrentRequestSession();
  const params = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const [albums, profile] = await Promise.all([
    prisma.galleryAlbum.findMany({
      where: { siteId: session.site.id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: {
        coverAsset: { select: { url: true } },
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            asset: { select: { url: true, width: true, height: true, sizeBytes: true } },
          },
        },
      },
    }),
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      include: {
        avatarAsset: { select: { url: true } },
        coverAsset: { select: { url: true } },
      },
    }),
  ]);

  return (
    <GalleryClient
      albums={albums}
      selectedAlbumId={params.albumId || null}
      avatarUrl={profile?.avatarAsset?.url ?? null}
      coverUrl={profile?.coverAsset?.url ?? null}
      messages={{
        uploaded: params.uploaded,
        error: params.error,
        created: params.created,
        deleted: params.deleted,
        renamed: params.renamed,
        coverSet: params.coverSet,
        featuredToggled: params.featuredToggled,
        reordered: params.reordered,
      }}
    />
  );
}
