"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createGitHubMediaStorage } from "@/modules/media/github-media-storage";
import { createMediaUploadService } from "@/modules/media/media-upload-service";
import { createPrismaMediaUploadRepository } from "@/modules/media/prisma-media-upload-repository";
import { createServicesPlatformRuntime } from "@/modules/services-platform/runtime";
import { dismissRecommendation } from "@/modules/services-platform/prisma-recommendations";
import { trackProductAnalyticsEvent } from "@/modules/services-platform/prisma-analytics";

const paymentMethods = new Set(["INSTAPAY", "VODAFONE_CASH", "STRIPE", "PAYPAL"]);
const proofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function customerSession() {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  return session;
}

function text(formData: FormData, key: string, max = 500) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function failure(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "تعذر تنفيذ الطلب.";
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export async function requestServiceOfferingAction(formData: FormData) {
  const session = await customerSession();
  const offeringId = text(formData, "offeringId", 200);
  const customerMessage = text(formData, "customerMessage", 4_000);
  const attributionId = text(formData, "attributionId", 200) || null;
  const suppliedKey = text(formData, "idempotencyKey", 200);
  if (!offeringId) failure("/dashboard/service-center", new Error("العرض غير صالح."));

  try {
    const runtime = createServicesPlatformRuntime(prisma);
    const result = await runtime.acquisitions.requestOffering({
      tenantId: session.tenant.id,
      userId: session.user.id,
      offeringId,
      idempotencyKey: suppliedKey || `customer:${session.user.id}:${randomUUID()}`,
      attributionId,
      customerMessage,
    });
    const acquisition = await prisma.acquisition.findUniqueOrThrow({
      where: { id: result.id },
      include: { offering: { select: { salesMode: true } } },
    });
    await trackProductAnalyticsEvent(prisma, {
      name: "acquisition.requested",
      idempotencyKey: `analytics:acquisition:${result.id}:requested`,
      tenantId: session.tenant.id,
      userId: session.user.id,
      offeringId,
      acquisitionId: result.id,
      attributionId,
      properties: { source: "service_center" },
    });
    if (acquisition.status === "REQUESTED" && acquisition.offering.salesMode === "SELF_SERVE") {
      if ((acquisition.acceptedTotal ?? 0) > 0) {
        await runtime.acquisitions.transition({ acquisitionId: acquisition.id, toStatus: "AWAITING_PAYMENT" });
      } else {
        await runtime.acquisitions.transition({ acquisitionId: acquisition.id, toStatus: "ACCEPTED" });
        await runtime.fulfillment.start({ acquisitionId: acquisition.id, idempotencyKey: `fulfillment:${acquisition.id}` });
      }
    }
    revalidatePath("/dashboard/service-center");
    redirect(`/dashboard/service-center/acquisitions/${result.id}?requested=1`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure("/dashboard/service-center", error);
  }
}

export async function createServicesPaymentDraftAction(formData: FormData) {
  const session = await customerSession();
  const acquisitionId = text(formData, "acquisitionId", 200);
  const method = text(formData, "method", 40).toUpperCase();
  const paymentAccountId = text(formData, "paymentAccountId", 200) || null;
  const reference = text(formData, "reference", 300) || null;
  const path = `/dashboard/service-center/acquisitions/${acquisitionId}`;
  if (!paymentMethods.has(method)) failure(path, new Error("اختر وسيلة دفع صحيحة."));
  if (!paymentAccountId) failure(path, new Error("اختر حساب الدفع."));

  try {
    const account = await prisma.paymentAccount.findFirst({
      where: { id: paymentAccountId, method: method as "INSTAPAY", isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!account) throw new Error("حساب الدفع غير متاح.");
    const draft = await createServicesPlatformRuntime(prisma).payments.createDraft({
      acquisitionId,
      tenantId: session.tenant.id,
      method: method as "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL",
      paymentAccountId,
      reference,
    });
    revalidatePath(path);
    redirect(`${path}?payment=${draft.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure(path, error);
  }
}

export async function submitServicesPaymentAction(formData: FormData) {
  const session = await customerSession();
  const acquisitionId = text(formData, "acquisitionId", 200);
  const paymentRequestId = text(formData, "paymentRequestId", 200);
  const proof = formData.get("proof");
  const path = `/dashboard/service-center/acquisitions/${acquisitionId}`;
  if (!(proof instanceof File) || proof.size === 0) failure(path, new Error("اختر صورة إثبات الدفع."));
  if (!proofTypes.has(proof.type) || proof.size > 5 * 1024 * 1024) failure(path, new Error("الإثبات يجب أن يكون JPEG أو PNG أو WebP وبحجم أقل من 5MB."));

  try {
    const payment = await prisma.paymentRequest.findFirst({
      where: { id: paymentRequestId, acquisitionId, tenantId: session.tenant.id, status: "DRAFT", deletedAt: null },
      select: { id: true },
    });
    if (!payment) throw new Error("مسودة الدفع غير متاحة.");
    const asset = await createMediaUploadService({
      storage: createGitHubMediaStorage(),
      repository: createPrismaMediaUploadRepository(prisma),
    }).uploadImage({ tenantId: session.tenant.id, file: proof, alt: "إثبات دفع خدمة FrameID" });
    await createServicesPlatformRuntime(prisma).payments.submit({
      paymentRequestId,
      tenantId: session.tenant.id,
      proofAssetId: asset.id,
      idempotencyKey: `services-payment-submit:${paymentRequestId}`,
    });
    revalidatePath(path);
    revalidatePath("/dashboard/service-center");
    redirect(`${path}?submitted=1`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure(path, error);
  }
}

export async function cancelServiceAcquisitionAction(formData: FormData) {
  const session = await customerSession();
  const acquisitionId = text(formData, "acquisitionId", 200);
  const path = `/dashboard/service-center/acquisitions/${acquisitionId}`;
  try {
    const owned = await prisma.acquisition.findFirst({ where: { id: acquisitionId, tenantId: session.tenant.id }, select: { id: true } });
    if (!owned) throw new Error("الطلب غير موجود.");
    await createServicesPlatformRuntime(prisma).acquisitions.transition({ acquisitionId, toStatus: "CANCELLED", reason: "CUSTOMER_REQUEST" });
    revalidatePath(path);
    revalidatePath("/dashboard/service-center");
    redirect(`${path}?cancelled=1`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure(path, error);
  }
}

export async function startServiceTrialAction(formData: FormData) {
  const session = await customerSession();
  const policyId = text(formData, "policyId", 200);
  try {
    await createServicesPlatformRuntime(prisma).trials.start({
      tenantId: session.tenant.id,
      policyId,
      idempotencyKey: `trial:${policyId}:${session.tenant.id}`,
    });
    revalidatePath("/dashboard/service-center");
    redirect("/dashboard/service-center?view=my&trial=started");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure("/dashboard/service-center", error);
  }
}

export async function dismissServiceRecommendationAction(formData: FormData) {
  const session = await customerSession();
  const attributionId = text(formData, "attributionId", 300);
  try {
    await dismissRecommendation(prisma, { tenantId: session.tenant.id, attributionId });
    await trackProductAnalyticsEvent(prisma, {
      name: "recommendation.dismissed",
      idempotencyKey: `analytics:recommendation:${attributionId}:dismissed`,
      tenantId: session.tenant.id,
      userId: session.user.id,
      attributionId,
    });
    revalidatePath("/dashboard/service-center");
    redirect("/dashboard/service-center?view=discover");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    failure("/dashboard/service-center?view=discover", error);
  }
}
