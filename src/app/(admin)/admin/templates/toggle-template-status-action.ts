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
    // البحث عن القالب بالـ ID (قد يكون DB id أو code-based id)
    let template = await prisma.template.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, code: true },
    });

    // إذا كان الـ ID هو code-based (لم يتم إنشاؤه في DB بعد)، نبحث بالـ code
    if (!template && id.startsWith("code-")) {
      const code = id.replace("code-", "");
      template = await prisma.template.findFirst({
        where: { code, deletedAt: null },
        select: { id: true, code: true },
      });
    }

    if (!template) {
      redirect("/admin/templates?error=template-not-found");
    }

    await prisma.template.update({
      where: { id: template.id },
      data: { status: nextStatus as "PUBLISHED" | "DRAFT" | "ARCHIVED" },
    });

    // سجل التدقيق
    await prisma.auditLog.create({
      data: {
        action: `TEMPLATE_STATUS_${nextStatus}`,
        entityType: "Template",
        entityId: template.id,
        metadata: {
          adminId: admin.id,
          code: template.code,
          previousStatus: formData.get("status") as string,
          newStatus: nextStatus,
        },
      },
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
