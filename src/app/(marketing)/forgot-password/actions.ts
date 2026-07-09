"use server";

import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { sendPasswordResetLink } from "@/modules/auth/password-reset-delivery";
import { createPasswordResetService } from "@/modules/auth/password-reset-service";
import { createPrismaPasswordResetRepository } from "@/modules/auth/prisma-password-reset-repository";
import { checkRateLimit } from "@/lib/rate-limiter";

const RESET_TOKEN_TTL_MINUTES = 60;

export async function requestPasswordResetAction(formData: FormData) {
  const identifier = readFormString(formData, "identifier") || readFormString(formData, "email");
  const ipKey = `forgot-password:${identifier.toLowerCase().trim()}`;

  const rateCheck = checkRateLimit(ipKey, 3, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    redirect("/forgot-password?error=" + encodeURIComponent("طلبات كتيرة أوي، استنى ١٥ دقيقة."));
  }

  const service = createPasswordResetService({
    repository: createPrismaPasswordResetRepository(prisma),
  });

  let result: Awaited<ReturnType<typeof service.requestPasswordReset>>;

  try {
    result = await service.requestPasswordReset({ identifier });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "requestPasswordReset", identifier },
    });
    redirect(
      `/forgot-password?error=${encodeURIComponent(userError.message)}`,
    );
  }

  if (result.rawToken && result.userEmail && result.userName) {
    const resetUrl = `${getPlatformBaseUrl()}/reset-password?token=${encodeURIComponent(result.rawToken)}`;

    await sendPasswordResetLink({
      email: result.userEmail,
      userName: result.userName,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });
  }

  redirect("/forgot-password?sent=1");
}
