"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";
import { createSessionForUser } from "@/modules/auth/session-service";
import { createPrismaSignupProvisioningRepository } from "@/modules/onboarding/prisma-signup-repository";
import { createSignupProvisioningService } from "@/modules/onboarding/signup-provisioning";

export async function signupAction(formData: FormData) {
  let cookieToSet:
    | Awaited<ReturnType<typeof createSessionForUser>>["cookie"]
    | undefined;
  let redirectTo = "/dashboard";

  try {
    const provisioningService = createSignupProvisioningService({
      repository: createPrismaSignupProvisioningRepository(prisma),
    });
    const result = await provisioningService.provisionTrialSite({
      name: readFormString(formData, "name"),
      identifier: readFormString(formData, "identifier"),
      password: readFormString(formData, "password"),
      selectedTemplateCode:
        readFormString(formData, "selectedTemplateCode") || undefined,
    });
    const session = await createSessionForUser({
      repository: createPrismaLoginRepository(prisma),
      userId: result.userId,
    });

    cookieToSet = session.cookie;
    redirectTo = result.redirectTo;
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "signup" },
    });
    redirect(`/signup?error=${encodeURIComponent(userError.message)}`);
  }

  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
  }

  redirect(redirectTo);
}
