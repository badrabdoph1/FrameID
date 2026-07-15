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
    toggled?: string;
    replaced?: string;
    coverReplaced?: string;
    error?: string;
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

  const [profile, gallerySection, firstAlbum] = await Promise.all([
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      include: {
        coverAsset: { select: { url: true } },
      },
    }),
    prisma.siteSection.findFirst({
      where: { siteId: session.site.id, type: "gallery", deletedAt: null },
      select: { isVisible: true },
    }),
    prisma.galleryAlbum.findFirst({
      where: { siteId: session.site.id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            sortOrder: true,
            asset: { select: { url: true } },
          },
        },
      },
    }),
  ]);

  const slotImages: Array<{ slot: number; imageId: string | null; url: string | null }> = [0, 1, 2, 3].map((slot) => {
    const img = firstAlbum?.images.find((i) => i.sortOrder === slot);
    return { slot, imageId: img?.id ?? null, url: img?.asset.url ?? null };
  });

  return (
    <GalleryClient
      coverUrl={profile?.coverAsset?.url ?? null}
      galleryVisible={gallerySection?.isVisible ?? true}
      slotImages={slotImages}
      toggled={typeof params.toggled === "string" ? true : false}
      replaced={typeof params.replaced === "string" ? params.replaced : undefined}
      coverReplaced={typeof params.coverReplaced === "string" ? true : false}
      error={typeof params.error === "string" ? params.error : undefined}
    />
  );
}
