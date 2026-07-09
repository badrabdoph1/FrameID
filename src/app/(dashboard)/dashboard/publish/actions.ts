"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function revalidateCustomerSite(siteSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/publish");
  revalidatePath(`/p/${siteSlug}`);
}

async function getPublishReadiness(siteId: string) {
  const [packagesCount, imagesCount, contactProfile, seoSettings] = await Promise.all([
    prisma.package.count({ where: { siteId, deletedAt: null } }),
    prisma.galleryImage.count({
      where: {
        deletedAt: null,
        album: { siteId, deletedAt: null },
        asset: { deletedAt: null },
      },
    }),
    prisma.contactProfile.findUnique({ where: { siteId } }),
    prisma.sEOSettings.findUnique({ where: { siteId }, select: { title: true, description: true, ogAssetId: true } }),
  ]);

  const hasContact = Boolean(contactProfile?.phone || contactProfile?.whatsapp || contactProfile?.email);
  const hasSeo = Boolean(seoSettings?.title && (seoSettings.description || seoSettings.ogAssetId));

  return {
    hasContact,
    hasPortfolio: imagesCount > 0,
    hasPackage: packagesCount > 0,
    hasSeo,
    canPublish: hasContact && imagesCount > 0 && packagesCount > 0 && hasSeo,
  };
}

export async function publishSiteAction() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const readiness = await getPublishReadiness(session.site.id);

  if (!readiness.canPublish) {
    redirect("/dashboard/publish?error=readiness");
  }

  try {
    await prisma.site.update({
      where: { id: session.site.id },
      data: {
        status: "PUBLISHED",
        isPublished: true,
        publishedVersion: { increment: 1 },
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "publishSite" },
    });
    redirect(`/dashboard/publish?error=${encodeURIComponent(userError.message)}`);
  }

  await revalidateCustomerSite(session.site.slug);
  redirect("/dashboard/publish?updated=published");
}

export async function unpublishSiteAction() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await prisma.site.update({
      where: { id: session.site.id },
      data: {
        status: "DRAFT",
        isPublished: false,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "unpublishSite" },
    });
    redirect(`/dashboard/publish?error=${encodeURIComponent(userError.message)}`);
  }

  await revalidateCustomerSite(session.site.slug);
  redirect("/dashboard/publish?updated=unpublished");
}

export async function updatePublishSeoAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const ogImageUrl = readString(formData, "ogImageUrl");
  const canonicalUrl = readString(formData, "canonicalUrl");
  const robotsIndex = formData.get("robotsIndex") === "on";

  if (!title) {
    redirect("/dashboard/publish?error=seo-title");
  }

  try {
    let ogAssetId: string | null = null;

    if (ogImageUrl) {
      const existing = await prisma.mediaAsset.findFirst({
        where: { url: ogImageUrl, deletedAt: null },
        select: { id: true }
      });
      ogAssetId = existing?.id ?? null;
    }

    await prisma.sEOSettings.upsert({
      where: { siteId: session.site.id },
      update: {
        title,
        description: description || null,
        ogAssetId,
        canonicalUrl: canonicalUrl || null,
        robotsIndex,
      },
      create: {
        siteId: session.site.id,
        title,
        description: description || null,
        ogAssetId,
        canonicalUrl: canonicalUrl || null,
        robotsIndex,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updatePublishSeo" },
    });
    redirect(`/dashboard/publish?error=${encodeURIComponent(userError.message)}`);
  }

  await revalidateCustomerSite(session.site.slug);
  redirect("/dashboard/publish?updated=seo");
}

export async function uploadShareImageAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string; url?: string }> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, message: "اختر صورة مشاركة أولاً" };
  }

  try {
    const uploadService = createMediaUploadService({
      storage: createLocalMediaStorage(),
      repository: createPrismaMediaUploadRepository(prisma),
    });

    const asset = await uploadService.uploadImage({
      tenantId: session.tenant.id,
      file: image,
      alt: "صورة مشاركة الموقع",
    });

    await prisma.sEOSettings.upsert({
      where: { siteId: session.site.id },
      update: { ogAssetId: asset.id },
      create: {
        siteId: session.site.id,
        title: session.site.title,
        ogAssetId: asset.id,
        robotsIndex: true,
      },
    });

    await revalidateCustomerSite(session.site.slug);

    return { ok: true, message: "تم رفع صورة المشاركة", url: asset.url };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadShareImage" },
    });
    return { ok: false, message: userError.message };
  }
}
