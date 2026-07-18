"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";
import { createGitHubMediaStorage } from "@/modules/media/github-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";

import type { PaymentStatus } from "@prisma/client";
import type { PaymentMethod } from "@/modules/billing/billing-activation-service";

const VALID_METHODS: PaymentMethod[] = ["INSTAPAY", "VODAFONE_CASH", "STRIPE", "PAYPAL"];
const EDITABLE_PAYMENT_STATUSES: PaymentStatus[] = ["DRAFT"];
const ACTIVE_PAYMENT_STATUSES: PaymentStatus[] = ["DRAFT", "SUBMITTED", "PENDING", "UNDER_REVIEW"];
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
const FALLBACK_CURRENCY = "EGP";

function getService() {
  return createBillingActivationService({ repository: createPrismaBillingActivationRepository(prisma) });
}

type ActionResult = { success: true; draftId?: string } | { success: false; error: string };

async function getSessionWithSub() {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  if (!session.subscription) throw new Error("لا يوجد اشتراك مفعّل. يرجى تفعيل حسابك أولاً.");
  return session;
}

function cleanString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getOwnedPaymentRequest(draftId: string, tenantId: string) {
  const request = await prisma.paymentRequest.findFirst({
    where: { id: draftId, tenantId, deletedAt: null },
    select: { id: true, tenantId: true, status: true, proofAssetId: true },
  });
  if (!request) throw new Error("لا يمكن الوصول إلى طلب الدفع هذا");
  return request;
}

async function assertEditableOwnedDraft(draftId: string, tenantId: string) {
  const request = await getOwnedPaymentRequest(draftId, tenantId);
  if (!EDITABLE_PAYMENT_STATUSES.includes(request.status)) {
    throw new Error("لا يمكن تعديل الطلب بعد إرساله للمراجعة");
  }
  return request;
}

async function validatePlan(planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { id: true, priceAmount: true, currency: true, isActive: true },
  });

  if (!plan || !plan.isActive) {
    throw new Error("الباقة غير متاحة للشراء");
  }

  return { id: plan.id, priceAmount: plan.priceAmount, currency: plan.currency || FALLBACK_CURRENCY };
}

async function validatePaymentAccount(method: PaymentMethod, accountId: string) {
  const account = await prisma.paymentAccount.findFirst({
    where: {
      id: accountId,
      isActive: true,
      deletedAt: null,
      method,
    },
    select: { id: true },
  });
  if (!account) throw new Error("حساب الدفع غير موجود أو غير تابع لوسيلة الدفع المختارة");
  return account;
}

async function assertNoDuplicateActiveRequest(tenantId: string, exceptId?: string) {
  const existing = await prisma.paymentRequest.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      status: { in: ACTIVE_PAYMENT_STATUSES },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true, status: true },
  });
  if (existing) {
    throw new Error("يوجد طلب تفعيل حالي بالفعل. أكمل الطلب الحالي أو ألغِه قبل إنشاء طلب جديد.");
  }
}

function validateProofFile(file: File) {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    throw new Error("نوع الملف غير مدعوم. يرجى رفع صورة JPEG أو PNG أو WebP.");
  }
  if (file.size > MAX_PROOF_SIZE_BYTES) {
    throw new Error("حجم صورة الإثبات أكبر من 5MB.");
  }
}

export async function createPaymentDraftAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const sid = session.subscription!.id;
  const planId = cleanString(formData.get("planId"));
  const method = cleanString(formData.get("method"));
  const accountId = cleanString(formData.get("accountId")) ?? cleanString(formData.get("paymentAccountId"));
  const reference = cleanString(formData.get("reference"));

  if (!planId) return { success: false, error: "يرجى اختيار الباقة" };
  if (!method || !VALID_METHODS.includes(method as PaymentMethod)) return { success: false, error: "يرجى اختيار وسيلة دفع صحيحة" };
  if (!accountId) return { success: false, error: "يرجى اختيار حساب الدفع" };

  try {
    const plan = await validatePlan(planId);
    await validatePaymentAccount(method as PaymentMethod, accountId);
    await assertNoDuplicateActiveRequest(session.tenant.id);

    const draft = await getService().createDraftPayment({
      tenantId: session.tenant.id,
      subscriptionId: sid,
      planId,
      method: method as PaymentMethod,
      paymentAccountId: accountId,
      amount: plan.priceAmount,
      currency: plan.currency,
      reference,
    });

    revalidatePath("/dashboard/billing");
    return { success: true, draftId: draft.id };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "createPaymentDraft" },
    });
    return { success: false, error: userError.message };
  }
}

export async function updatePaymentDraftAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const draftId = cleanString(formData.get("draftId"));
  const method = cleanString(formData.get("method"));
  const accountId = cleanString(formData.get("accountId")) ?? cleanString(formData.get("paymentAccountId"));
  const reference = cleanString(formData.get("reference"));

  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    await assertEditableOwnedDraft(draftId, session.tenant.id);
    if (method && !VALID_METHODS.includes(method as PaymentMethod)) throw new Error("وسيلة الدفع غير صالحة");
    if (method && accountId) await validatePaymentAccount(method as PaymentMethod, accountId);
    await getService().updateDraftPayment(draftId, {
      method: method ? (method as PaymentMethod) : undefined,
      paymentAccountId: accountId ?? undefined,
      reference,
    });
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updatePaymentDraft", draftId },
    });
    return { success: false, error: userError.message };
  }
}

export async function uploadProofAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const draftId = cleanString(formData.get("draftId"));
  const proof = formData.get("proof");
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };
  if (!(proof instanceof File) || proof.size === 0) return { success: false, error: "يرجى اختيار صورة الإثبات" };

  try {
    await assertEditableOwnedDraft(draftId, session.tenant.id);
    validateProofFile(proof);

    const assetId = await createMediaUploadService({
      storage: createGitHubMediaStorage(),
      repository: createPrismaMediaUploadRepository(prisma),
    }).uploadImage({ tenantId: session.tenant.id, file: proof, alt: "إثبات دفع" }).then((asset) => asset.id);

    await getService().uploadPaymentProof(draftId, assetId);
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadProof", draftId },
    });
    return { success: false, error: userError.message };
  }
}

export async function removeProofAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const draftId = cleanString(formData.get("draftId"));
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    await assertEditableOwnedDraft(draftId, session.tenant.id);
    await getService().removePaymentProof(draftId);
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "removeProof", draftId },
    });
    return { success: false, error: userError.message };
  }
}

export async function submitPaymentRequestAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const draftId = cleanString(formData.get("draftId"));
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    const request = await assertEditableOwnedDraft(draftId, session.tenant.id);
    if (!request.proofAssetId) throw new Error("يرجى رفع إثبات الدفع قبل إرسال الطلب");
    await getService().submitPayment(draftId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "submitPaymentRequest", draftId },
    });
    return { success: false, error: userError.message };
  }
}

export async function cancelPaymentRequestAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const draftId = cleanString(formData.get("draftId"));
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    await getOwnedPaymentRequest(draftId, session.tenant.id);
    await getService().cancelPayment(draftId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "cancelPaymentRequest", draftId },
    });
    return { success: false, error: userError.message };
  }
}
