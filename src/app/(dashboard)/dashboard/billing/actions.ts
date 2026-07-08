"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createBillingActivationService } from "@/modules/billing/billing-activation-service";
import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";
import { createLocalMediaStorage } from "@/modules/media/local-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";

import type { PaymentMethod } from "@/modules/billing/billing-activation-service";

const VALID_METHODS: PaymentMethod[] = ["INSTAPAY", "VODAFONE_CASH", "STRIPE", "PAYPAL"];

function getService() {
  return createBillingActivationService({
    repository: createPrismaBillingActivationRepository(prisma)
  });
}

type ActionResult = { success: true } | { success: false; error: string };

async function getSessionWithSub() {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  if (!session.subscription) redirect("/dashboard/billing?error=no-subscription");
  return session as NonNullable<typeof session>;
}

/* ─── Create Draft Payment ─────────────────────── */

export async function createPaymentDraftAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();
  const sid = session.subscription!.id;

  const planId = formData.get("planId");
  const method = formData.get("method");
  const accountId = formData.get("accountId");

  if (typeof planId !== "string" || !planId) {
    return { success: false, error: "يرجى اختيار الباقة" };
  }
  if (typeof method !== "string" || !VALID_METHODS.includes(method as PaymentMethod)) {
    return { success: false, error: "يرجى اختيار وسيلة دفع صحيحة" };
  }

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { success: false, error: "الباقة غير موجودة" };

    const service = getService();
    const draft = await service.createDraftPayment({
      tenantId: session.tenant.id,
      subscriptionId: sid,
      planId,
      method: method as PaymentMethod,
      amount: plan.priceAmount,
      currency: plan.currency
    });

    if (typeof accountId === "string" && accountId) {
      await service.updateDraftPayment(draft.id, { paymentAccountId: accountId });
    }

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "createPaymentDraft" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Update Payment Draft ─────────────────────── */

export async function updatePaymentDraftAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();

  const draftId = formData.get("draftId") as string;
  const method = formData.get("method");
  const accountId = formData.get("accountId");
  const reference = formData.get("reference");

  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    const service = getService();
    await service.updateDraftPayment(draftId, {
      method: typeof method === "string" && VALID_METHODS.includes(method as PaymentMethod)
        ? (method as PaymentMethod)
        : undefined,
      paymentAccountId: typeof accountId === "string" ? accountId : undefined,
      reference: typeof reference === "string" ? reference : undefined
    });

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updatePaymentDraft" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Upload Proof Image ────────────────────────── */

export async function uploadProofAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();

  const draftId = formData.get("draftId") as string;
  const proof = formData.get("proof");

  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };
  if (!(proof instanceof File) || proof.size === 0) {
    return { success: false, error: "يرجى اختيار صورة الإثبات" };
  }

  try {
    const assetId = await createMediaUploadService({
      storage: createLocalMediaStorage(),
      repository: createPrismaMediaUploadRepository(prisma)
    }).uploadImage({
      tenantId: session.tenant.id,
      file: proof,
      alt: "إثبات دفع"
    }).then((asset) => asset.id);

    const service = getService();
    await service.uploadPaymentProof(draftId, assetId);

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "uploadProof" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Remove Proof Image ────────────────────────── */

export async function removeProofAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();

  const draftId = formData.get("draftId") as string;
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    const service = getService();
    await service.removePaymentProof(draftId);
    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "removeProof" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Submit Payment Request ───────────────────── */

export async function submitPaymentRequestAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();

  const draftId = formData.get("draftId") as string;
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    const service = getService();
    await service.submitPayment(draftId);

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "submitPaymentRequest" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Cancel Payment Request ───────────────────── */

export async function cancelPaymentRequestAction(formData: FormData): Promise<ActionResult> {
  const session = await getSessionWithSub();

  const draftId = formData.get("draftId") as string;
  if (!draftId) return { success: false, error: "معرّف المسودة مطلوب" };

  try {
    await prisma.paymentRequest.update({
      where: { id: draftId },
      data: { status: "CANCELLED", deletedAt: new Date() }
    });

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "cancelPaymentRequest" }
    });
    return { success: false, error: userError.message };
  }
}

/* ─── Legacy Action (kept for backward compat) ─── */

export async function requestActivationAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.subscription) {
    redirect("/dashboard/billing?error=no-subscription");
  }

  const method = formData.get("method");
  const reference = formData.get("reference");
  const proof = formData.get("proof");
  const draftId = formData.get("draftId");
  const submit = formData.get("submit") === "true";

  if (typeof method !== "string" || !VALID_METHODS.includes(method as PaymentMethod)) {
    redirect("/dashboard/billing?error=invalid-method");
  }

  try {
    const service = getService();

    let paymentRequestId: string;

    if (draftId && typeof draftId === "string") {
      paymentRequestId = draftId;

      await service.updateDraftPayment(paymentRequestId, {
        method: method as PaymentMethod,
        reference: typeof reference === "string" ? reference : undefined
      });
    } else {
      const draft = await service.createDraftPayment({
        tenantId: session.tenant.id,
        subscriptionId: session.subscription.id,
        method: method as PaymentMethod,
        amount: 120000,
        currency: "EGP"
      });

      paymentRequestId = draft.id;

      if (typeof reference === "string" && reference.trim()) {
        await service.updateDraftPayment(paymentRequestId, {
          reference: reference.trim()
        });
      }
    }

    if (proof instanceof File && proof.size > 0) {
      const assetId = await createMediaUploadService({
        storage: createLocalMediaStorage(),
        repository: createPrismaMediaUploadRepository(prisma)
      }).uploadImage({
        tenantId: session.tenant.id,
        file: proof,
        alt: "إثبات دفع"
      }).then((asset) => asset.id);

      if (assetId) {
        await service.uploadPaymentProof(paymentRequestId, assetId);
      }
    }

    if (submit) {
      await service.submitPayment(paymentRequestId);
    }

    revalidatePath("/dashboard/billing");
    if (submit) {
      redirect("/dashboard/billing?requested=1");
    } else {
      redirect(`/dashboard/billing?draft=${paymentRequestId}`);
    }
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "requestActivation" }
    });
    redirect(`/dashboard/billing?error=${encodeURIComponent(userError.message)}`);
  }
}
