"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPasswordResetService } from "@/modules/auth/password-reset-service";
import { createPrismaPasswordResetRepository } from "@/modules/auth/prisma-password-reset-repository";

export async function resetPasswordAction(formData: FormData) {
  const token = readFormString(formData, "token");
  const password = readFormString(formData, "password");

  try {
    await createPasswordResetService({
      repository: createPrismaPasswordResetRepository(prisma)
    }).resetPassword({
      rawToken: token,
      newPassword: password
    });
  } catch {
    redirect("/reset-password?error=invalid");
  }

  redirect("/login?error=تم تحديث كلمة المرور. سجل الدخول بكلمتك الجديدة.");
}
