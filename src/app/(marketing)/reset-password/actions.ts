"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPasswordResetService } from "@/modules/auth/password-reset-service";
import { createPrismaPasswordResetRepository } from "@/modules/auth/prisma-password-reset-repository";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function resetPasswordAction(formData: FormData) {
  const token = readFormString(formData, "token");
  const password = readFormString(formData, "password");

  const ipKey = `reset-password:${token.slice(0, 16)}`;

  const rateCheck = checkRateLimit(ipKey, 5, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    redirect("/reset-password?error=" + encodeURIComponent("طلبات كثيرة جداً. حاول بعد ساعة."));
  }

  try {
    await createPasswordResetService({
      repository: createPrismaPasswordResetRepository(prisma),
    }).resetPassword({
      rawToken: token,
      newPassword: password,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "resetPassword" },
    });
    redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(userError.message)}`,
    );
  }

  redirect("/login?message=تم تغيير كلمة المرور بنجاح. سجل الدخول بكلمتك الجديدة.");
}
