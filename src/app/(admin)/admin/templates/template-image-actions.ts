"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateTemplateSurfaces(code: string) {
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath(`/templates/${code}/preview`);
}

export async function saveTemplateCoverAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const useDefault = formData.get("useDefault") === "on";
  const file = formData.get("coverImage");

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new Error("القالب غير موجود.");

    const previewData: JsonRecord = isRecord(current.previewData)
      ? { ...current.previewData }
      : {};

    let nextUrl: string | null = null;
    if (useDefault) {
      delete previewData.previewImage;
      delete previewData.thumbnail;
      delete previewData.image;
      delete previewData.cover;
    } else if (file instanceof File && file.size > 0) {
      const uploaded = await uploadPlatformTemplateImage(file);
      previewData.previewImage = uploaded.url;
      nextUrl = uploaded.url;
    } else {
      throw new Error("اختر صورة من جهازك أو فعّل خيار استخدام الصورة الافتراضية.");
    }

    await prisma.template.update({
      where: { id: current.id },
      data: { previewData: previewData as Prisma.InputJsonValue },
    });

    await prisma.auditLog.create({
      data: {
        action: useDefault ? "TEMPLATE_COVER_RESET" : "TEMPLATE_COVER_UPDATED",
        entityType: "Template",
        entityId: current.id,
        metadata: {
          adminId: admin.id,
          adminEmail: admin.email,
          code: current.code,
          useDefault,
          url: nextUrl,
        } as Prisma.InputJsonObject,
      },
    });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تعديل غلاف قالب" });

    revalidateTemplateSurfaces(current.code);
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "saveTemplateCover", id },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/templates?coverSaved=1");
}
