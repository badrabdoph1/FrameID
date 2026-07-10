"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";

type JsonRecord = Record<string, unknown>;

type VisualTarget = "hero" | "package";

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

export async function saveTemplateVisualImageAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const target = readString(formData, "target") as VisualTarget;
  const targetKey = readString(formData, "targetKey");
  const useDefault = formData.get("useDefault") === "on";
  const file = formData.get("image");

  if (target !== "hero" && target !== "package") {
    redirect("/admin/templates?error=نوع الصورة غير صالح.");
  }

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new Error("القالب غير موجود.");

    const previewData: JsonRecord = isRecord(current.previewData)
      ? { ...current.previewData }
      : {};

    let nextUrl: string | null = null;
    if (!useDefault) {
      if (!(file instanceof File) || file.size <= 0) {
        throw new Error("اختر صورة من جهازك أو فعّل خيار استخدام الصورة الافتراضية.");
      }
      const uploaded = await uploadPlatformTemplateImage(file);
      nextUrl = uploaded.url;
    }

    if (target === "hero") {
      const hero = isRecord(previewData.hero) ? { ...previewData.hero } : {};
      if (useDefault) delete hero.imageUrl;
      else hero.imageUrl = nextUrl;
      previewData.hero = hero;
    } else {
      if (!Array.isArray(previewData.packages)) {
        throw new Error("لا توجد باقات محفوظة داخل القالب.");
      }

      let found = false;
      previewData.packages = previewData.packages.map((item, index) => {
        if (!isRecord(item)) return item;
        const itemId = typeof item.id === "string" ? item.id : `package-${index + 1}`;
        if (itemId !== targetKey) return item;
        found = true;
        const updated = { ...item };
        if (useDefault) delete updated.imageUrl;
        else updated.imageUrl = nextUrl;
        return updated;
      });

      if (!found) throw new Error("الباقة المحددة غير موجودة.");
    }

    await prisma.template.update({
      where: { id: current.id },
      data: { previewData: previewData as Prisma.InputJsonValue },
    });

    await prisma.auditLog.create({
      data: {
        action: useDefault ? "TEMPLATE_IMAGE_RESET" : "TEMPLATE_IMAGE_UPDATED",
        entityType: "Template",
        entityId: current.id,
        metadata: {
          adminId: admin.id,
          adminEmail: admin.email,
          code: current.code,
          target,
          targetKey: targetKey || null,
          useDefault,
          url: nextUrl,
        } as Prisma.InputJsonObject,
      },
    });

    revalidateTemplateSurfaces(current.code);
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "saveTemplateVisualImage", id, target, targetKey },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/admin/templates?visualSaved=1");
}
