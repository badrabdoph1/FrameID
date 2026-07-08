"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";

function createSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "album";
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createAlbumAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const title = readString(formData, "title");

  if (!title) {
    redirect("/dashboard/gallery?error=empty-album-title");
  }

  const baseSlug = createSlug(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  try {
    const maxOrder = await prisma.galleryAlbum.aggregate({
      where: { siteId: session.site.id, deletedAt: null },
      _max: { sortOrder: true },
    });

    await prisma.galleryAlbum.create({
      data: {
        siteId: session.site.id,
        title,
        slug,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        isVisible: true,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "createAlbum" },
    });
    redirect(`/dashboard/gallery?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect("/dashboard/gallery?created=1");
}

export async function renameAlbumAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const albumId = readString(formData, "albumId");
  const title = readString(formData, "title");

  if (!albumId || !title) {
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=invalid-rename`);
  }

  try {
    await prisma.galleryAlbum.update({
      where: { id: albumId, siteId: session.site.id },
      data: { title },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "renameAlbum" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&renamed=1`);
}

export async function deleteAlbumAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const albumId = readString(formData, "albumId");

  if (!albumId) {
    redirect("/dashboard/gallery?error=invalid-album");
  }

  try {
    await prisma.galleryAlbum.update({
      where: { id: albumId, siteId: session.site.id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "deleteAlbum" },
    });
    redirect(`/dashboard/gallery?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect("/dashboard/gallery?deleted=1");
}

export async function uploadToAlbumAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const albumId = readString(formData, "albumId");
  const images = formData.getAll("images");

  if (!albumId) {
    redirect("/dashboard/gallery?error=invalid-album");
  }

  const validFiles = images.filter((f): f is File => f instanceof File && f.size > 0);

  if (validFiles.length === 0) {
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=no-images`);
  }

  const uploadService = createMediaUploadService({
    storage: createLocalMediaStorage(),
    repository: createPrismaMediaUploadRepository(prisma),
  });

  let uploaded = 0;

  try {
    for (const file of validFiles) {
      const asset = await uploadService.uploadImage({
        tenantId: session.tenant.id,
        file,
      });

      const maxOrder = await prisma.galleryImage.aggregate({
        where: { albumId, deletedAt: null },
        _max: { sortOrder: true },
      });

      await prisma.galleryImage.create({
        data: {
          albumId,
          assetId: asset.id,
          sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        },
      });

      uploaded++;
    }
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadToAlbum" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&uploaded=${uploaded}`);
}

export async function deleteImageAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const imageId = readString(formData, "imageId");
  const albumId = readString(formData, "albumId");

  if (!imageId) {
    redirect("/dashboard/gallery?error=invalid-image");
  }

  try {
    await prisma.galleryImage.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "deleteImage" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&deleted=1`);
}

export async function reorderImageAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const imageId = readString(formData, "imageId");
  const albumId = readString(formData, "albumId");
  const direction = readString(formData, "direction");

  if (!imageId || !direction) {
    redirect("/dashboard/gallery?error=invalid-reorder");
  }

  try {
    const current = await prisma.galleryImage.findUnique({
      where: { id: imageId },
      select: { sortOrder: true, albumId: true },
    });

    if (!current) {
      redirect("/dashboard/gallery?error=image-not-found");
    }

    const neighbour = direction === "up"
      ? await prisma.galleryImage.findFirst({
          where: { albumId: current.albumId, deletedAt: null, sortOrder: { lt: current.sortOrder } },
          orderBy: { sortOrder: "desc" },
          select: { id: true, sortOrder: true },
        })
      : await prisma.galleryImage.findFirst({
          where: { albumId: current.albumId, deletedAt: null, sortOrder: { gt: current.sortOrder } },
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true },
        });

    if (!neighbour) {
      redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=at-boundary`);
    }

    await prisma.$transaction([
      prisma.galleryImage.update({
        where: { id: imageId },
        data: { sortOrder: neighbour.sortOrder },
      }),
      prisma.galleryImage.update({
        where: { id: neighbour.id },
        data: { sortOrder: current.sortOrder },
      }),
    ]);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "reorderImage" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&reordered=1`);
}

export async function setCoverImageAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const imageId = readString(formData, "imageId");
  const albumId = readString(formData, "albumId");

  if (!imageId || !albumId) {
    redirect("/dashboard/gallery?error=invalid-input");
  }

  try {
    const image = await prisma.galleryImage.findUnique({
      where: { id: imageId },
      select: { assetId: true },
    });

    if (!image) {
      redirect("/dashboard/gallery?error=image-not-found");
    }

    await prisma.galleryAlbum.update({
      where: { id: albumId, siteId: session.site.id },
      data: { coverAssetId: image.assetId },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "setCoverImage" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&coverSet=1`);
}

export async function toggleFeaturedAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const imageId = readString(formData, "imageId");
  const albumId = readString(formData, "albumId");

  if (!imageId) {
    redirect("/dashboard/gallery?error=invalid-image");
  }

  try {
    const current = await prisma.galleryImage.findUnique({
      where: { id: imageId },
      select: { isFeatured: true },
    });

    if (!current) {
      redirect("/dashboard/gallery?error=image-not-found");
    }

    await prisma.galleryImage.update({
      where: { id: imageId },
      data: { isFeatured: !current.isFeatured },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "toggleFeatured" },
    });
    redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  redirect(`/dashboard/gallery?albumId=${encodeURIComponent(albumId)}&featuredToggled=1`);
}
