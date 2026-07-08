import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createPrismaAdminAuthRepository } from "@/modules/admin/prisma-admin-auth-repository";
import { createAdminLoginService } from "@/modules/admin/admin-auth-service";

function wantsJsonResponse(request: Request): boolean {
  return (
    request.headers.get("x-admin-login-client") === "1" ||
    request.headers.get("accept")?.includes("application/json") === true
  );
}

function createLoginSuccessResponse(request: Request) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json({ ok: true, redirectTo: "/admin" });
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
}

function createLoginErrorResponse(request: Request, message: string) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  const redirectUrl = new URL(
    `/admin/login?error=${encodeURIComponent(message)}`,
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

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

    const response = createLoginSuccessResponse(request);

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

    return createLoginErrorResponse(request, userError.message);
  }
}
