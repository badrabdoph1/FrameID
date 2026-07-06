"use server";

import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { prisma } from "@/lib/prisma";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { sendPasswordResetLink } from "@/modules/auth/password-reset-delivery";
import { createPasswordResetService } from "@/modules/auth/password-reset-service";
import { createPrismaPasswordResetRepository } from "@/modules/auth/prisma-password-reset-repository";

export async function requestPasswordResetAction(formData: FormData) {
  const email = readFormString(formData, "email");
  const service = createPasswordResetService({
    repository: createPrismaPasswordResetRepository(prisma)
  });

  const result = await service.requestPasswordReset({ email });

  if (result.rawToken && result.userEmail) {
    await sendPasswordResetLink({
      email: result.userEmail,
      resetUrl: `${getPlatformBaseUrl()}/reset-password?token=${encodeURIComponent(
        result.rawToken
      )}`
    });
  }

  redirect("/forgot-password?sent=1");
}
