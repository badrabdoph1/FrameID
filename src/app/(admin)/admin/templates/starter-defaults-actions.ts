"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  normalizeTemplateStarterSharedDefaults,
  serializeTemplateStarterDefaults,
  TEMPLATE_STARTER_DEFAULTS_CODE,
} from "@/modules/themes/template-starter-defaults";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveStarterDefaultsAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const defaults = normalizeTemplateStarterSharedDefaults({
    photographerName: readString(formData, "photographerName"),
    studioName: readString(formData, "studioName"),
    description: readString(formData, "description"),
    heroImageUrl: readString(formData, "heroImageUrl"),
  });

  const theme = await prisma.theme.findFirst({
    where: { deletedAt: null },
    orderBy: [{ status: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (!theme) redirect("/admin/templates?error=لا يوجد ثيم متاح لحفظ بيانات البداية.");

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

  await prisma.auditLog.create({
    data: {
      action: "TEMPLATE_STARTER_DEFAULTS_UPDATED",
      entityType: "TemplateContentSource",
      entityId: saved.id,
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        code: TEMPLATE_STARTER_DEFAULTS_CODE,
      } as Prisma.InputJsonObject,
    },
  });
  await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تعديل بيانات بداية القوالب" });

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?starterDefaultsSaved=1");
}
