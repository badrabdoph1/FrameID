"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

type JsonRecord = Record<string, unknown>;

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

function readJsonObject(raw: string, fallback: Record<string, unknown> = {}): Record<string, unknown> {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function auditTemplate(input: { adminId: string; adminEmail?: string; action: string; templateId: string; code: string; metadata?: JsonRecord }) {
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
    const basePreview = isRecord(current.previewData) ? { ...current.previewData } : {};
    const baseSettings = isRecord(current.settings) ? { ...current.settings } : {};

    const previewImage = readString(formData, "previewImage");
    const coverImage = readString(formData, "coverImage");
    const version = readString(formData, "version");
    const themeId = readString(formData, "themeId");

    if (previewImage) basePreview.previewImage = previewImage;
    if (coverImage) basePreview.coverImage = coverImage;

    if (version) baseSettings.version = version;
    baseSettings.contentSource = "starter-content-defaults";

    if (themeId) {
      const themeExists = await prisma.theme.count({ where: { id: themeId, deletedAt: null } });
      if (!themeExists) throw new Error("الثيم المحدد غير متاح.");
    }

    await prisma.template.update({
      where: { id },
      data: {
        themeId: themeId || current.themeId,
        code: readString(formData, "code") || current.code,
        name: readString(formData, "name") || current.name,
        status: readString(formData, "status") || current.status,
        showroomOrder: readInt(formData, "showroomOrder", current.showroomOrder),
        previewData: basePreview as Prisma.InputJsonValue,
        settings: baseSettings as Prisma.InputJsonValue,
        deletedAt: null,
      } as never,
    });

    await auditTemplate({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_UPDATED",
      templateId: id,
      code: current.code,
      metadata: { status: readString(formData, "status") || current.status },
    });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تعديل قالب" });
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

  try {
    const nextStatus = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const updated = await prisma.template.update({ where: { id }, data: { status: nextStatus } });
    await auditTemplate({ adminId: admin.id, adminEmail: admin.email, action: nextStatus === "PUBLISHED" ? "TEMPLATE_PUBLISHED" : "TEMPLATE_UNPUBLISHED", templateId: updated.id, code: updated.code, metadata: { status: nextStatus } });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: nextStatus === "PUBLISHED" ? "نشر قالب" : "إلغاء نشر قالب" });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "toggleTemplate", id } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?toggled=1");
}
