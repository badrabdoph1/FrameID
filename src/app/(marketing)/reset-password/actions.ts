"use server";

import { redirect } from "next/navigation";

import { PASSWORD_RECOVERY_SUPPORT_MESSAGE } from "@/components/auth/password-recovery-support-card";
import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPasswordResetService } from "@/modules/auth/password-reset-service";
import { createPrismaPasswordResetRepository } from "@/modules/auth/prisma-password-reset-repository";
import { checkRateLimit } from "@/lib/rate-limiter";

function redirectRecoveryFailure(token: string): never {
  redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(PASSWORD_RECOVERY_SUPPORT_MESSAGE)}`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = readFormString(formData, "token");
  const password = readFormString(formData, "password");
  const ipKey = `reset-password:${token.slice(0, 16)}`;

  try {
    const rateCheck = checkRateLimit(ipKey, 5, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      redirectRecoveryFailure(token);
    }

    await createPasswordResetService({
      repository: createPrismaPasswordResetRepository(prisma),
    }).resetPassword({
      rawToken: token,
      newPassword: password,
    });
  } catch (error) {
    await processError(error, {
      metadata: { action: "resetPassword" },
    });
    redirectRecoveryFailure(token);
  }

  redirect("/login?message=اتغيرت كلمة السر بنجاح. سجل دخولك بالكلمة الجديدة.");
}
