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

  if (method !== "INSTAPAY" && method !== "VODAFONE_CASH") {
    redirect("/dashboard/billing?error=invalid-method");
  }

  try {
    const service = createBillingActivationService({
      repository: createPrismaBillingActivationRepository(prisma),
    });
    const proofAsset =
      proof instanceof File && proof.size > 0
        ? await createMediaUploadService({
            storage: createLocalMediaStorage(),
            repository: createPrismaMediaUploadRepository(prisma),
          }).uploadImage({
            tenantId: session.tenant.id,
            file: proof,
            alt: "Payment proof",
          })
        : null;

    await service.requestManualActivation({
      tenantId: session.tenant.id,
      subscriptionId: session.subscription.id,
      method,
      amount: 120000,
      currency: "EGP",
      reference: typeof reference === "string" ? reference : undefined,
      proofAssetId: proofAsset?.id,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "requestActivation" },
    });
    redirect(`/dashboard/billing?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?requested=1");
}
