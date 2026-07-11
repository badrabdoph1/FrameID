"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanTemplatePreview(value: unknown): Record<string, unknown> {
  const preview = isRecord(value) ? { ...value } : {};
  delete preview.packages;
  delete preview.extras;
  delete preview.gallery;
  delete preview.hero;
  delete preview.seo;
  delete preview.sharedDefaults;
  return preview;
}

function readStarterOverride(formData: FormData): Record<string, unknown> | null {
  const override = {
    photographerName: readString(formData, "starterOverridePhotographerName"),
    studioName: readString(formData, "starterOverrideStudioName"),
    description: readString(formData, "starterOverrideDescription"),
    heroImageUrl: readString(formData, "starterOverrideHeroImageUrl"),
  };
  const entries = Object.entries(override).filter(([, value]) => Boolean(value));
  return entries.length ? Object.fromEntries(entries) : null;
}

async function auditTemplate(input: { adminId: string; adminEmail?: string; action: string; templateId: string; code: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Template",
      entityId: input.templateId,
      metadata: { adminId: input.adminId, adminEmail: input.adminEmail, code: input.code, ...(input.metadata ?? {}) } as Prisma.InputJsonObject,
    },
  });
}

export async function saveTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  if (!id) redirect("/admin/templates?error=missing-template");

  const current = await prisma.template.findFirst({
    where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
  });
  if (!current) redirect("/admin/templates?error=template-not-found");

  try {
    const preview = cleanTemplatePreview(current.previewData);
    const settings = isRecord(current.settings) ? { ...current.settings } : {};
    const previewTitle = readString(formData, "previewTitle");
    const previewDescription = readString(formData, "previewDescription");
    const previewImage = readString(formData, "previewImage");
    const callToAction = readString(formData, "callToAction");
    const version = readString(formData, "version");
    const themeId = readString(formData, "themeId");

    if (previewTitle) { preview.title = previewTitle; preview.headline = previewTitle; }
    else { delete preview.title; delete preview.headline; }
    if (previewDescription) { preview.description = previewDescription; preview.subtitle = previewDescription; }
    else { delete preview.description; delete preview.subtitle; }
    if (previewImage) preview.previewImage = previewImage;
    else delete preview.previewImage;
    if (callToAction) preview.callToAction = callToAction;
    else delete preview.callToAction;

    const starterOverride = readStarterOverride(formData);
    if (starterOverride) preview.starterContentOverride = starterOverride;
    else delete preview.starterContentOverride;

    if (version) settings.version = version;
    else delete settings.version;
    settings.contentSource = "starter-content-defaults";

    if (themeId) {
      const themeExists = await prisma.theme.count({ where: { id: themeId, deletedAt: null } });
      if (!themeExists) throw new Error("الثيم المحدد غير متاح.");
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        themeId: themeId || current.themeId,
        code: readString(formData, "code") || current.code,
        name: readString(formData, "name") || current.name,
        status: readString(formData, "status") || current.status,
        showroomOrder: readInt(formData, "showroomOrder", current.showroomOrder),
        previewData: preview as Prisma.InputJsonValue,
        settings: settings as Prisma.InputJsonValue,
        deletedAt: null,
      } as never,
    });

    await auditTemplate({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_UPDATED",
      templateId: updated.id,
      code: updated.code,
      metadata: {
        status: updated.status,
        hasStarterOverride: Boolean(starterOverride),
        contentSource: "starter-content-defaults",
        duplicatedContentRemoved: true,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveTemplate", id } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?saved=1");
}

export async function toggleTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const current = await prisma.template.findFirst({ where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } } });
  if (!current) redirect("/admin/templates?error=template-not-found");
  const nextStatus = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const updated = await prisma.template.update({ where: { id }, data: { status: nextStatus } });
  await auditTemplate({ adminId: admin.id, adminEmail: admin.email, action: nextStatus === "PUBLISHED" ? "TEMPLATE_PUBLISHED" : "TEMPLATE_UNPUBLISHED", templateId: updated.id, code: updated.code, metadata: { status: nextStatus } });
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?toggled=1");
}
