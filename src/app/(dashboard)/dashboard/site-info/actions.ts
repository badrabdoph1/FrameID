"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";
import { createLocalMediaStorage } from "@/modules/media/local-media-storage";

export type AutosaveState = { ok: boolean; message: string };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateContact(siteSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/site-info");
  revalidatePath(`/p/${siteSlug}`);
}

export async function updateSiteInfoAction(
  formData: FormData,
): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const userName = readString(formData, "userName");
  const fields: Record<string, string | null> = {};
  const textFields = [
    "studioName",
    "bio",
    "longDescription",
    "phone",
    "whatsapp",
    "email",
    "facebook",
    "instagram",
    "tiktok",
    "workLocation",
  ] as const;

  for (const field of textFields) {
    if (formData.has(field)) {
      const val = readString(formData, field);
      fields[field] = val || null;
    }
  }

  if (!userName && Object.keys(fields).length === 0) {
    return { ok: true, message: "لا توجد تغييرات" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (userName) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { name: userName },
        });
      }

      if (Object.keys(fields).length > 0) {
        await tx.contactProfile.upsert({
          where: { siteId: session.site.id },
          update: fields,
          create: {
            siteId: session.site.id,
            ...fields,
          },
        });
      }
    });

    revalidateContact(session.site.slug);
    return { ok: true, message: "تم الحفظ تلقائيًا" };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateSiteInfo" },
    });
    return { ok: false, message: userError.message };
  }
}

export async function uploadSiteImageAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string; assetId?: string }> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const image = formData.get("image");
  const field = readString(formData, "field");

  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, message: "لم يتم اختيار صورة" };
  }

  if (field !== "avatarAssetId" && field !== "coverAssetId") {
    return { ok: false, message: "حقل غير صالح" };
  }

  try {
    const uploadService = createMediaUploadService({
      storage: createLocalMediaStorage(),
      repository: createPrismaMediaUploadRepository(prisma),
    });

    const asset = await uploadService.uploadImage({
      tenantId: session.tenant.id,
      file: image,
      alt: field === "avatarAssetId" ? "الصورة الشخصية" : "صورة الغلاف",
    });

    await prisma.contactProfile.upsert({
      where: { siteId: session.site.id },
      update: { [field]: asset.id },
      create: { siteId: session.site.id, [field]: asset.id },
    });

    revalidateContact(session.site.slug);

    return {
      ok: true,
      message: "تم رفع الصورة",
      assetId: asset.id,
    };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadSiteImage", field },
    });
    return { ok: false, message: userError.message };
  }
}
