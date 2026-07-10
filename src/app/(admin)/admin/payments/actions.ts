"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";
import { lifecycleDurationOptions, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";

function getService() {
  return createBillingActivationService({
    repository: createPrismaBillingActivationRepository(prisma)
  });
}

function parseDuration(formData: FormData) {
  const rawPreset = String(formData.get("durationPreset") || "30") as LifecycleDurationPreset;
  const preset = lifecycleDurationOptions.some((item) => item.value === rawPreset) ? rawPreset : "30";
  const customDays = Math.max(1, Math.min(3650, Math.round(Number(formData.get("customDays")) || 30)));
  return { preset, customDays };
}

export async function approvePaymentAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  try {
    const paymentRequestId = formData.get("paymentRequestId");
    const adminNote = formData.get("adminNote");
    const duration = parseDuration(formData);

    if (typeof paymentRequestId !== "string" || !paymentRequestId) {
      redirect("/admin/payments?error=invalid-payment");
    }

    const service = getService();

    await service.approvePayment({
      paymentRequestId,
      reviewerId: session.user.id,
      adminName: session.user.name,
      adminNote:
        typeof adminNote === "string" && adminNote.trim()
          ? adminNote.trim()
          : undefined,
      durationPreset: duration.preset,
      customDays: duration.customDays
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
  revalidatePath("/admin/customers");
  revalidatePath("/dashboard");
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
      adminName: session.user.name,
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
      adminName: session.user.name,
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
