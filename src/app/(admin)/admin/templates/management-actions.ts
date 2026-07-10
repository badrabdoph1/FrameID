"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  assertTemplateCode,
  buildTemplateDefaults,
  nextAvailableTemplateCode,
} from "@/modules/templates/template-admin-policy";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateTemplates() {
  revalidatePath("/admin/templates");
  revalidatePath("/admin/content");
  revalidatePath("/templates");
}

async function audit(input: {
  adminId: string;
  adminEmail?: string;
  action: string;
  templateId: string;
  code: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Template",
      entityId: input.templateId,
      metadata: {
        adminId: input.adminId,
        adminEmail: input.adminEmail,
        code: input.code,
        ...(input.metadata ?? {}),
      } as Prisma.InputJsonObject,
    },
  });
}

export async function createTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const name = readString(formData, "name");
  const requestedCode = readString(formData, "code");
  const themeId = readString(formData, "themeId");

  if (!name || !themeId) {
    redirect("/admin/templates?error=اكتب اسم القالب واختر الثيم.");
  }

  try {
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, deletedAt: null },
      select: { id: true, name: true, defaultConfig: true },
    });
    if (!theme) throw new Error("الثيم المحدد غير موجود.");

    const unavailable = new Set(
      (await prisma.template.findMany({ select: { code: true } })).map((item) => item.code),
    );
    const code = nextAvailableTemplateCode(requestedCode || name, unavailable);
    const defaults = buildTemplateDefaults({
      name,
      description: `قالب ${name} مبني على ${theme.name}.`,
      themeDefaultConfig:
        typeof theme.defaultConfig === "object" && theme.defaultConfig !== null && !Array.isArray(theme.defaultConfig)
          ? (theme.defaultConfig as Record<string, unknown>)
          : {},
    });

    const lastOrder = await prisma.template.aggregate({
      where: { deletedAt: null },
      _max: { showroomOrder: true },
    });

    const created = await prisma.template.create({
      data: {
        themeId: theme.id,
        name,
        code,
        status: "DRAFT",
        showroomOrder: (lastOrder._max.showroomOrder ?? -1) + 1,
        previewData: defaults.previewData as Prisma.InputJsonValue,
        settings: defaults.settings as Prisma.InputJsonValue,
      },
    });

    await audit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_CREATED",
      templateId: created.id,
      code: created.code,
      metadata: { themeId: theme.id },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "createTemplate" },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateTemplates();
  redirect("/admin/templates?created=1");
}

export async function duplicateTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new Error("القالب غير موجود.");

    const unavailable = new Set(
      (await prisma.template.findMany({ select: { code: true } })).map((item) => item.code),
    );
    const code = nextAvailableTemplateCode(`${current.code}-copy`, unavailable);
    const created = await prisma.template.create({
      data: {
        themeId: current.themeId,
        name: `${current.name} — نسخة`,
        code,
        status: "DRAFT",
        showroomOrder: current.showroomOrder + 1,
        previewData: current.previewData as Prisma.InputJsonValue,
        settings: current.settings as Prisma.InputJsonValue,
      },
    });

    await audit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_DUPLICATED",
      templateId: created.id,
      code: created.code,
      metadata: { sourceTemplateId: current.id },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "duplicateTemplate", id },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateTemplates();
  redirect("/admin/templates?duplicated=1");
}

export async function restoreTemplateDefaultsAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null },
      include: { theme: { select: { name: true, defaultConfig: true } } },
    });
    if (!current) throw new Error("القالب غير موجود.");

    const defaults = buildTemplateDefaults({
      name: current.name,
      description: `قالب ${current.name} مبني على ${current.theme.name}.`,
      themeDefaultConfig:
        typeof current.theme.defaultConfig === "object" && current.theme.defaultConfig !== null && !Array.isArray(current.theme.defaultConfig)
          ? (current.theme.defaultConfig as Record<string, unknown>)
          : {},
    });

    await prisma.template.update({
      where: { id: current.id },
      data: {
        previewData: defaults.previewData as Prisma.InputJsonValue,
        settings: defaults.settings as Prisma.InputJsonValue,
      },
    });

    await audit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_DEFAULTS_RESTORED",
      templateId: current.id,
      code: current.code,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "restoreTemplateDefaults", id },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateTemplates();
  redirect("/admin/templates?restored=1");
}

export async function archiveTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null },
    });
    if (!current) throw new Error("القالب غير موجود.");

    await prisma.template.update({
      where: { id: current.id },
      data: { status: "ARCHIVED", deletedAt: new Date() },
    });

    await audit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_ARCHIVED",
      templateId: current.id,
      code: current.code,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "archiveTemplate", id },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateTemplates();
  redirect("/admin/templates?archived=1");
}
