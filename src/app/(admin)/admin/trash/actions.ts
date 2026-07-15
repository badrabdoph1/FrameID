"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

async function getService() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  const repo = createCustomerAdminRepository(prisma);
  const service = createCustomerAdminService(repo);
  return { admin, service };
}

export async function restoreFromTrashAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");

  try {
    const result = await service.restoreFromTrash(id, { id: admin.id, name: admin.name });
    if (!result) redirect("/admin/trash?error=" + encodeURIComponent("العميل غير موجود في السلة."));
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "restoreFromTrash", customerId: id } });
    redirect("/admin/trash?error=" + encodeURIComponent(userError.message));
  }

  revalidatePath("/admin/trash");
  revalidatePath("/admin/customers");
  redirect("/admin/trash?restored=1");
}

export async function permanentDeleteAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");

  try {
    const result = await service.permanentDelete(id, { id: admin.id, name: admin.name });
    if (!result) redirect("/admin/trash?error=" + encodeURIComponent("العميل غير موجود في السلة."));
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "permanentDelete", customerId: id } });
    redirect("/admin/trash?error=" + encodeURIComponent(userError.message));
  }

  revalidatePath("/admin/trash");
  redirect("/admin/trash?deleted=1");
}

export async function emptyTrashAction() {
  const { admin, service } = await getService();

  try {
    const result = await service.emptyTrash({ id: admin.id, name: admin.name });
    if (result.count === 0) {
      redirect("/admin/trash?error=" + encodeURIComponent("السلة فارغة بالفعل."));
    }
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "emptyTrash" } });
    redirect("/admin/trash?error=" + encodeURIComponent(userError.message));
  }

  revalidatePath("/admin/trash");
  redirect("/admin/trash?emptied=1");
}
