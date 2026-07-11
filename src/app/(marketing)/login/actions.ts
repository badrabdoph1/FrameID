"use server";

import { ZodError } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { getPostLoginRedirectPath } from "@/modules/auth/current-session-service";
import { createLoginService } from "@/modules/auth/login-service";
import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";
import { shouldUseSecureSessionCookie } from "@/modules/auth/request-cookie-security";

function redirectLoginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "البيانات غلط. ادخلها تاني.";
  }

  if (error instanceof Error) {
    if (error.message === "اكتب رقم الهاتف أو البريد الإلكتروني.") return error.message;
    if (error.message === "البريد الإلكتروني غلط.") return error.message;
    if (error.message === "رقم الهاتف غلط.") return "رقم الهاتف غلط. ادخل رقم زي 01000000000 أو بريد إلكتروني صحيح.";
    if (error.message === "Invalid phone/email or password") return "البريد أو كلمة المرور غلط. لو مش فاكر، جرّب تسيب كلمة المرور.";
    if (error.message === "Invalid email or password") return "البريد أو كلمة المرور غلط. لو مش فاكر، جرّب تسيب كلمة المرور.";
  }

  return null;
}

export async function loginAction(formData: FormData) {
  let cookieToSet:
    | Awaited<ReturnType<ReturnType<typeof createLoginService>["login"]>>["session"]["cookie"]
    | undefined;
  let redirectPath: ReturnType<typeof getPostLoginRedirectPath> = "/dashboard";

  try {
    const cookieSecure = await shouldUseSecureSessionCookie();
    const loginService = createLoginService({
      repository: createPrismaLoginRepository(prisma),
      cookieSecure,
    });
    const result = await loginService.login({
      identifier: readFormString(formData, "identifier"),
      password: readFormString(formData, "password"),
    });

    cookieToSet = result.session.cookie;
    redirectPath = getPostLoginRedirectPath(result.user.role);
  } catch (error) {
    const directMessage = getLoginErrorMessage(error);
    if (directMessage) redirectLoginError(directMessage);

    const { userError } = await processError(error, {
      metadata: { action: "login" },
    });
    redirectLoginError(userError.message);
  }

  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
  }

  redirect(redirectPath);
}
