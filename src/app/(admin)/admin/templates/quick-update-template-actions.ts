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

export async function quickUpdateTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!id) redirect("/admin/templates?error=معرف-القالب-مفقود");

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
    });
    if (!current) redirect("/admin/templates?error=القالب-غير-موجود");

    const basePreview = (current.previewData && typeof current.previewData === "object"
      ? { ...(current.previewData as Record<string, unknown>) }
      : {}) as Record<string, unknown>;

    if (description) {
      basePreview.description = description;
    }

    await prisma.template.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        previewData: basePreview as Prisma.InputJsonValue,
      },
    });
    void admin;
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "quickUpdateTemplate", id } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
}
