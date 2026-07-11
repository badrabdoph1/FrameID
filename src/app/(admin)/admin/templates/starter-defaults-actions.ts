"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  normalizeTemplateStarterSharedDefaults,
  serializeTemplateStarterDefaults,
  TEMPLATE_STARTER_DEFAULTS_CODE,
} from "@/modules/themes/template-starter-defaults";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function readJson(formData: FormData, key: string): unknown {
  const raw = readString(formData, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`الحقل ${key} يحتوي JSON غير صالح.`);
  }
}

function stripDuplicatedContent(value: unknown): Prisma.InputJsonValue {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};

  delete source.packages;
  delete source.extras;
  delete source.gallery;
  delete source.seo;
  delete source.hero;
  delete source.sharedDefaults;

  return source as Prisma.InputJsonValue;
}

export async function saveStarterDefaultsAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");

  try {
    const defaults = normalizeTemplateStarterSharedDefaults({
      photographerName: readString(formData, "photographerName"),
      studioName: readString(formData, "studioName"),
      description: readString(formData, "description"),
      heroImageUrl: readString(formData, "heroImageUrl"),
      galleryImages: readJson(formData, "galleryImagesJson"),
      packages: readJson(formData, "packagesJson"),
      extras: readJson(formData, "extrasJson"),
      seo: {
        title: readString(formData, "seoTitle"),
        description: readString(formData, "seoDescription"),
        canonicalUrl: readString(formData, "seoCanonicalUrl"),
        robotsIndex: readBool(formData, "seoRobotsIndex"),
      },
      commonTexts: {
        galleryTitle: readString(formData, "galleryTitle"),
        galleryDescription: readString(formData, "galleryDescription"),
        packagesTitle: readString(formData, "packagesTitle"),
        packagesDescription: readString(formData, "packagesDescription"),
        extrasTitle: readString(formData, "extrasTitle"),
        extrasDescription: readString(formData, "extrasDescription"),
        contactTitle: readString(formData, "contactTitle"),
        contactCallToAction: readString(formData, "contactCallToAction"),
      },
    });

    const theme = await prisma.theme.findFirst({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (!theme) throw new Error("لا يوجد ثيم متاح لحفظ بيانات البداية.");

    const saved = await prisma.template.upsert({
      where: { code: TEMPLATE_STARTER_DEFAULTS_CODE },
      create: {
        themeId: theme.id,
        code: TEMPLATE_STARTER_DEFAULTS_CODE,
        name: "Starter Content Defaults",
        status: "ARCHIVED",
        showroomOrder: -1,
        previewData: serializeTemplateStarterDefaults(defaults) as Prisma.InputJsonValue,
        settings: { internal: true, source: "template-content-source" } as Prisma.InputJsonValue,
      },
      update: {
        previewData: serializeTemplateStarterDefaults(defaults) as Prisma.InputJsonValue,
        settings: { internal: true, source: "template-content-source" } as Prisma.InputJsonValue,
        deletedAt: null,
      },
    });

    const templates = await prisma.template.findMany({
      where: { code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      select: { id: true, previewData: true },
    });

    await prisma.$transaction(
      templates.map((template) => prisma.template.update({
        where: { id: template.id },
        data: { previewData: stripDuplicatedContent(template.previewData) },
      })),
    );

    await prisma.auditLog.create({
      data: {
        action: "TEMPLATE_STARTER_DEFAULTS_UPDATED",
        entityType: "TemplateContentSource",
        entityId: saved.id,
        metadata: {
          adminId: admin.id,
          adminEmail: admin.email,
          code: TEMPLATE_STARTER_DEFAULTS_CODE,
          cleanedTemplates: templates.length,
          sourceOfTruth: "template-content-source",
        } as Prisma.InputJsonObject,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveStarterDefaults" } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?starterDefaultsSaved=1");
}
