"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";
import { lifecycleDurationOptions, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";

export type PaymentActionResult = {
  ok: boolean;
  message: string;
};

function getService() {
  return createBillingActivationService({ repository: createPrismaBillingActivationRepository(prisma) });
}

function parseDuration(formData: FormData) {
  const rawPreset = String(formData.get("durationPreset") || "30") as LifecycleDurationPreset;
  const preset = lifecycleDurationOptions.some((item) => item.value === rawPreset) ? rawPreset : "30";
  const customDays = Math.max(1, Math.min(3650, Math.round(Number(formData.get("customDays")) || 30)));
  return { preset, customDays };
}

function revalidatePaymentWorkspace() {
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/customers");
  revalidatePath("/dashboard");
}

export async function approvePaymentAction(formData: FormData): Promise<PaymentActionResult> {
  const session = await requireSuperAdminSession();
  const paymentRequestId = formData.get("paymentRequestId");
  const adminNote = formData.get("adminNote");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) {
    return { ok: false, message: "طلب الدفع غير صحيح." };
  }

  try {
    const duration = parseDuration(formData);
    await getService().approvePayment({
      paymentRequestId,
      reviewerId: session.user.id,
      adminName: session.user.name,
      adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined,
      durationPreset: duration.preset === "keep" ? "30" : duration.preset,
      customDays: duration.customDays,
    });
    revalidatePaymentWorkspace();
    return { ok: true, message: "تم قبول الدفع وتفعيل الاشتراك بالمدة المحددة." };
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "approvePayment", paymentRequestId } });
    return { ok: false, message: userError.message };
  }
}

export async function rejectPaymentAction(formData: FormData): Promise<PaymentActionResult> {
  const session = await requireSuperAdminSession();
  const paymentRequestId = formData.get("paymentRequestId");
  const adminNote = formData.get("adminNote");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) return { ok: false, message: "طلب الدفع غير صحيح." };
  if (typeof adminNote !== "string" || !adminNote.trim()) return { ok: false, message: "اكتب سبب الرفض." };

  try {
    await getService().rejectPayment({ paymentRequestId, reviewerId: session.user.id, adminName: session.user.name, reason: adminNote.trim() });
    revalidatePaymentWorkspace();
    return { ok: true, message: "تم رفض طلب الدفع." };
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "rejectPayment", paymentRequestId } });
    return { ok: false, message: userError.message };
  }
}

export async function requestReuploadAction(formData: FormData): Promise<PaymentActionResult> {
  const session = await requireSuperAdminSession();
  const paymentRequestId = formData.get("paymentRequestId");
  const note = formData.get("note");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) return { ok: false, message: "طلب الدفع غير صحيح." };
  if (typeof note !== "string" || !note.trim()) return { ok: false, message: "اكتب ملاحظة إعادة الرفع." };

  try {
    await getService().requestReupload({ paymentRequestId, reviewerId: session.user.id, adminName: session.user.name, note: note.trim() });
    revalidatePaymentWorkspace();
    return { ok: true, message: "تم طلب إعادة رفع إثبات الدفع." };
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "requestReupload", paymentRequestId } });
    return { ok: false, message: userError.message };
  }
}

export async function addPaymentNoteAction(formData: FormData): Promise<PaymentActionResult> {
  const session = await requireSuperAdminSession();
  const paymentRequestId = formData.get("paymentRequestId");
  const note = formData.get("note");

  if (typeof paymentRequestId !== "string" || !paymentRequestId) return { ok: false, message: "طلب الدفع غير صحيح." };
  if (typeof note !== "string" || !note.trim()) return { ok: false, message: "اكتب الملاحظة." };

  try {
    await getService().addPaymentNote({ paymentRequestId, adminId: session.user.id, adminName: session.user.name, note: note.trim() });
    revalidatePaymentWorkspace();
    return { ok: true, message: "تم حفظ الملاحظة." };
  } catch (error) {
    const { userError } = await processError(error, { userId: session.user.id, metadata: { action: "addPaymentNote", paymentRequestId } });
    return { ok: false, message: userError.message };
  }
}
