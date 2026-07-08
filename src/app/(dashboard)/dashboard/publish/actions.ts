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

  revalidatePath("/dashboard/publish");
  revalidatePath(`/p/${session.site.slug}`);
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

    revalidatePath("/dashboard/publish");
    revalidatePath(`/p/${session.site.slug}`);

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
