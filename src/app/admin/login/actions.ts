"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createPrismaAdminAuthRepository } from "@/modules/admin/prisma-admin-auth-repository";
import { createAdminLoginService } from "@/modules/admin/admin-auth-service";
import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants";
import { readFormString } from "@/modules/auth/auth-action-utils";
import type { AdminSessionCookie } from "@/modules/admin/admin-session-constants";

export async function adminLoginAction(formData: FormData) {
  let cookieToSet: AdminSessionCookie | undefined;

  try {
    const loginService = createAdminLoginService(
      createPrismaAdminAuthRepository(prisma as never),
    );
    const result = await loginService.login({
      email: readFormString(formData, "email"),
      password: readFormString(formData, "password"),
    });

    cookieToSet = result.session.cookie;
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "adminLogin" },
    });
    redirect(`/admin/login?error=${encodeURIComponent(userError.message)}`);
  }

  if (cookieToSet) {
    const cookieStore = await cookies();
    cookieStore.set(cookieToSet.name, cookieToSet.value, cookieToSet.options);
  }

  redirect("/admin");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
