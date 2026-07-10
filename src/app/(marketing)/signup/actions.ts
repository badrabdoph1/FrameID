"use server";

import { ZodError } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";
import { shouldUseSecureSessionCookie } from "@/modules/auth/request-cookie-security";
import { createSessionForUser } from "@/modules/auth/session-service";
import { getLifecycleTimerSettings } from "@/modules/lifecycle/customer-lifecycle";
import { createPrismaSignupProvisioningRepository } from "@/modules/onboarding/prisma-signup-repository";
import { createSignupProvisioningService } from "@/modules/onboarding/signup-provisioning";

function redirectSignupError(message: string): never {
  redirect(`/signup?error=${encodeURIComponent(message)}`);
}

function getSignupErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "راجع البيانات واكتبها بشكل صحيح.";
  }

  if (error instanceof Error) {
    if (error.message === "اكتب رقم الهاتف أو البريد الإلكتروني.") return error.message;
    if (error.message === "البريد الإلكتروني غير صحيح.") return error.message;
    if (error.message === "رقم الهاتف غير صحيح.") return "رقم الهاتف غير صحيح. اكتب رقم مصري مثل 01000000000 أو بريد إلكتروني صحيح.";
    if (error.message === "Email already exists") return "هذا الحساب موجود بالفعل. سجل دخول بدل إنشاء حساب جديد.";
    if (error.message === "رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل") return "رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل. سجل دخول بدل إنشاء حساب جديد.";
    if (error.message === "Selected template is not available") return "القالب المحدد غير متاح حاليًا. اختر قالبًا آخر من صفحة القوالب.";
  }

  return null;
}

export async function signupAction(formData: FormData) {
  let cookieToSet:
    | Awaited<ReturnType<typeof createSessionForUser>>["cookie"]
    | undefined;
  let redirectTo = "/dashboard";

  try {
    const cookieSecure = await shouldUseSecureSessionCookie();
    const lifecycleSettings = await getLifecycleTimerSettings(prisma);
    const provisioningService = createSignupProvisioningService({
      repository: createPrismaSignupProvisioningRepository(prisma),
      trialDays: lifecycleSettings.trial.defaultDays,
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
      cookieSecure,
    });

    cookieToSet = session.cookie;
    redirectTo = result.redirectTo;
  } catch (error) {
    const directMessage = getSignupErrorMessage(error);
    if (directMessage) redirectSignupError(directMessage);

    const { userError } = await processError(error, {
      metadata: { action: "signup" },
    });
    redirectSignupError(userError.message);
  }

  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
  }

  redirect(redirectTo);
}
