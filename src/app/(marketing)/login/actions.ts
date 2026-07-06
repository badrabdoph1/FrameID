"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAuthActionErrorMessage, readFormString } from "@/modules/auth/auth-action-utils";
import { getPostLoginRedirectPath } from "@/modules/auth/current-session-service";
import { createLoginService } from "@/modules/auth/login-service";
import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";

export async function loginAction(formData: FormData) {
  let cookieToSet:
    | Awaited<ReturnType<ReturnType<typeof createLoginService>["login"]>>["session"]["cookie"]
    | undefined;
  let redirectPath: ReturnType<typeof getPostLoginRedirectPath> = "/dashboard";

  try {
    const loginService = createLoginService({
      repository: createPrismaLoginRepository(prisma)
    });
    const result = await loginService.login({
      email: readFormString(formData, "email"),
      password: readFormString(formData, "password")
    });

    cookieToSet = result.session.cookie;
    redirectPath = getPostLoginRedirectPath(result.user.role);
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent(getAuthActionErrorMessage(error))}`);
  }

  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
  }

  redirect(redirectPath);
}
