"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { processError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export async function reviewCustomerRequestAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const requestId = readString(formData, "requestId");
  const action = readString(formData, "action");
  const adminNote = readString(formData, "adminNote");

  if (!requestId || !action) {
    redirect("/admin/customer-requests?error=invalid");
  }

  const validStatuses: Record<string, "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"> = {
    review: "IN_REVIEW",
    approve: "APPROVED",
    reject: "REJECTED",
    complete: "COMPLETED",
    cancel: "CANCELLED",
  };

  const newStatus = validStatuses[action];
  if (!newStatus) {
    redirect("/admin/customer-requests?error=invalid-action");
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    reviewedBy: session.user.id,
    reviewedAt: new Date(),
  };

  if (adminNote) {
    updateData.adminNote = adminNote;
  }

  if (newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  try {
    await prisma.customerRequest.update({
      where: { id: requestId },
      data: updateData,
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "reviewCustomerRequest", requestId } });
    redirect(`/admin/customer-requests?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/customer-requests");
  redirect("/admin/customer-requests?updated=1");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
