"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createGalleryManagementService } from "@/modules/gallery/gallery-management-service";
import { createPrismaGalleryManagementRepository } from "@/modules/gallery/prisma-gallery-management-repository";
import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";

export async function uploadGalleryImageAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const image = formData.get("image");
  const caption = formData.get("caption");

  if (!(image instanceof File) || image.size === 0) {
    redirect("/dashboard/gallery?error=لم يتم اختيار صورة للرفع");
  }

  const uploadService = createMediaUploadService({
    storage: createLocalMediaStorage(),
    repository: createPrismaMediaUploadRepository(prisma),
  });
  const galleryService = createGalleryManagementService({
    repository: createPrismaGalleryManagementRepository(prisma),
  });

  try {
    const asset = await uploadService.uploadImage({
      tenantId: session.tenant.id,
      file: image,
      alt: typeof caption === "string" ? caption : undefined,
    });

    await galleryService.addPortfolioImage({
      siteId: session.site.id,
      assetId: asset.id,
      caption: typeof caption === "string" ? caption : undefined,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadGalleryImage" },
    });
    redirect(`/dashboard/gallery?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/gallery");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/gallery?uploaded=1");
}
