"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export async function toggleTemplateStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin/templates?error=missing-id");
  }

  const nextStatus = formData.get("nextStatus");
  if (typeof nextStatus !== "string" || !["PUBLISHED", "DRAFT", "ARCHIVED"].includes(nextStatus)) {
    redirect("/admin/templates?error=invalid-status");
  }

  try {
    const template = await prisma.template.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, code: true },
    });

    if (!template) {
      redirect("/admin/templates?error=template-not-found");
    }

    await prisma.template.update({
      where: { id },
      data: { status: nextStatus as "PUBLISHED" | "DRAFT" | "ARCHIVED" },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "toggleTemplateStatus", id },
    });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?toggled=1");
}
