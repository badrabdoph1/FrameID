"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";

function getService() {
  return createBillingActivationService({
    repository: createPrismaBillingActivationRepository(prisma)
  });
}

export async function approvePaymentAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  try {
    const paymentRequestId = formData.get("paymentRequestId");
    const adminNote = formData.get("adminNote");

    if (typeof paymentRequestId !== "string" || !paymentRequestId) {
      redirect("/admin/payments?error=invalid-payment");
    }

    const service = getService();

    await service.approvePayment({
      paymentRequestId,
      reviewerId: session.user.id,
      adminNote:
        typeof adminNote === "string" && adminNote.trim()
          ? adminNote.trim()
          : undefined
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "approvePayment", paymentRequestId: formData.get("paymentRequestId") }
    });
    redirect(`/admin/payments?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?approved=1");
}

export async function rejectPaymentAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  try {
    const paymentRequestId = formData.get("paymentRequestId");
    const adminNote = formData.get("adminNote");

    if (typeof paymentRequestId !== "string" || !paymentRequestId) {
      redirect("/admin/payments?error=invalid-payment");
    }

    if (typeof adminNote !== "string" || !adminNote.trim()) {
      redirect("/admin/payments?error=missing-reason");
    }

    const service = getService();

    await service.rejectPayment({
      paymentRequestId,
      reviewerId: session.user.id,
      reason: adminNote.trim()
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "rejectPayment", paymentRequestId: formData.get("paymentRequestId") }
    });
    redirect(`/admin/payments?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?rejected=1");
}

export async function requestReuploadAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  try {
    const paymentRequestId = formData.get("paymentRequestId");
    const note = formData.get("note");

    if (typeof paymentRequestId !== "string" || !paymentRequestId) {
      redirect("/admin/payments?error=invalid-payment");
    }

    if (typeof note !== "string" || !note.trim()) {
      redirect("/admin/payments?error=missing-note");
    }

    const service = getService();

    await service.requestReupload({
      paymentRequestId,
      reviewerId: session.user.id,
      note: note.trim()
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "requestReupload", paymentRequestId: formData.get("paymentRequestId") }
    });
    redirect(`/admin/payments?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?reupload=1");
}

export async function addPaymentNoteAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  try {
    const paymentRequestId = formData.get("paymentRequestId");
    const note = formData.get("note");

    if (typeof paymentRequestId !== "string" || !paymentRequestId) {
      redirect("/admin/payments?error=invalid-payment");
    }

    if (typeof note !== "string" || !note.trim()) {
      redirect("/admin/payments?error=missing-note");
    }

    const service = getService();

    await service.addPaymentNote({
      paymentRequestId,
      adminId: session.user.id,
      adminName: session.user.name,
      note: note.trim()
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      metadata: { action: "addPaymentNote", paymentRequestId: formData.get("paymentRequestId") }
    });
    redirect(`/admin/payments?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirect("/admin/payments?note-added=1");
}
