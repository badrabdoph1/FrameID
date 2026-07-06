"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";

export async function approvePaymentAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const paymentRequestId = formData.get("paymentRequestId");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) {
    redirect("/admin/payments?error=invalid-payment");
  }

  const service = createBillingActivationService({
    repository: createPrismaBillingActivationRepository(prisma)
  });

  await service.approveManualPayment({
    paymentRequestId,
    reviewerId: session.user.id,
    adminNote: "تم القبول من لوحة الإدارة العليا"
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?approved=1");
}

export async function rejectPaymentAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const paymentRequestId = formData.get("paymentRequestId");
  const adminNote = formData.get("adminNote");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) {
    redirect("/admin/payments?error=invalid-payment");
  }

  const service = createBillingActivationService({
    repository: createPrismaBillingActivationRepository(prisma)
  });

  await service.rejectManualPayment({
    paymentRequestId,
    reviewerId: session.user.id,
    adminNote:
      typeof adminNote === "string" && adminNote.trim()
        ? adminNote.trim()
        : "تم الرفض من لوحة الإدارة العليا"
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?rejected=1");
}
