"use server";

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

export async function reorderTemplatesAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const raw = readString(formData, "order");
  if (!raw) redirect("/admin/templates?error=ترتيب-غير-صحيح");

  let ids: string[] = [];
  try {
    ids = JSON.parse(raw);
  } catch {
    redirect("/admin/templates?error=ترتيب-غير-صحيح");
  }
  if (!Array.isArray(ids) || ids.length === 0) redirect("/admin/templates?error=ترتيب-غير-صحيح");

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.template.updateMany({
          where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
          data: { showroomOrder: index },
        }),
      ),
    );
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "reorderTemplates" } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?saved=1");
}

export async function moveTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const direction = readString(formData, "direction");
  if (!id || !["up", "down", "top", "bottom"].includes(direction)) {
    redirect("/admin/templates?error=طلب-غير-صحيح");
  }

  try {
    const current = await prisma.template.findFirst({
      where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      select: { showroomOrder: true },
    });
    if (!current) redirect("/admin/templates?error=القالب-غير-موجود");

    const siblings = await prisma.template.findMany({
      where: { deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      orderBy: { showroomOrder: "asc" },
      select: { id: true, showroomOrder: true },
    });

    const currentIndex = siblings.findIndex((t) => t.id === id);
    if (currentIndex === -1) redirect("/admin/templates?error=القالب-غير-موجود");

    const targetIndex =
      direction === "up"
        ? Math.max(0, currentIndex - 1)
        : direction === "down"
          ? Math.min(siblings.length - 1, currentIndex + 1)
          : direction === "top"
            ? 0
            : siblings.length - 1;

    const reordered = [...siblings];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((t, index) =>
        prisma.template.updateMany({
          where: { id: t.id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
          data: { showroomOrder: index },
        }),
      ),
    );
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "moveTemplate", id, direction } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?saved=1");
}
