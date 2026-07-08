import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createPrismaAdminAuthRepository } from "@/modules/admin/prisma-admin-auth-repository";
import { createAdminLoginService } from "@/modules/admin/admin-auth-service";

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const email = params.get("email") ?? "";
    const password = params.get("password") ?? "";

    const loginService = createAdminLoginService(
      createPrismaAdminAuthRepository(prisma),
    );
    const result = await loginService.login({ email, password });

    const redirectUrl = new URL("/admin", request.url);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(
      result.session.cookie.name,
      result.session.cookie.value,
      result.session.cookie.options,
    );

    return response;
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "adminLogin" },
    });

    const redirectUrl = new URL(
      `/admin/login?error=${encodeURIComponent(userError.message)}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  }
}
