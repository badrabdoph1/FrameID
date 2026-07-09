import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createPrismaAdminAuthRepository } from "@/modules/admin/prisma-admin-auth-repository";
import { createAdminLoginService, type AdminLoginResult } from "@/modules/admin/admin-auth-service";
import {
  buildAdminSessionCookie,
  createSignedAdminSessionToken,
  getAdminSessionExpiresAt,
} from "@/modules/admin/admin-session-tokens";
import type { AdminSessionCookie } from "@/modules/admin/admin-session-constants";

type EnvAdminLoginResult = Pick<AdminLoginResult, "admin" | "session">;

type AdminLoginSuccess = {
  admin: AdminLoginResult["admin"];
  session: {
    id: string;
    expiresAt: Date;
    cookie: AdminSessionCookie;
  };
};

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

function createLoginErrorResponse(request: Request, message: string, status = 401) {
  if (wantsJsonResponse(request)) {
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  const redirectUrl = new URL(
    `/admin/login?error=${encodeURIComponent(message)}`,
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}

function createStatelessAdminLoginResult(
  admin: AdminLoginResult["admin"],
  expiresAt = getAdminSessionExpiresAt(new Date()),
): AdminLoginSuccess {
  const rawToken = createSignedAdminSessionToken(admin, expiresAt);

  return {
    admin,
    session: {
      id: "stateless-admin-session",
      expiresAt,
      cookie: buildAdminSessionCookie(rawToken, expiresAt),
    },
  };
}

function getEnvAdminLogin(email: string, password: string): EnvAdminLoginResult | null {
  const envEmail = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const normalizedEmail = email.trim().toLowerCase();

  if (!envEmail || !envPassword) return null;
  if (normalizedEmail !== envEmail || password !== envPassword) return null;

  return createStatelessAdminLoginResult({
    id: `env-super-admin:${envEmail}`,
    email: envEmail,
    name: "FrameID Admin",
    role: "SUPER_ADMIN",
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error("Admin login timed out")), timeoutMs);
    }),
  ]);
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const email = params.get("email") ?? "";
    const password = params.get("password") ?? "";

    if (!email.trim() || !password) {
      return createLoginErrorResponse(request, "اكتب البريد الإلكتروني وكلمة السر.", 400);
    }

    const resultFromEnv = getEnvAdminLogin(email, password);
    const result = resultFromEnv ?? await withTimeout(
      createAdminLoginService(createPrismaAdminAuthRepository(prisma)).login({ email, password }),
      8000,
    );
    const statelessResult = resultFromEnv ?? createStatelessAdminLoginResult(
      result.admin,
      result.session.expiresAt,
    );

    const response = createLoginSuccessResponse(request);

    response.cookies.set(
      statelessResult.session.cookie.name,
      statelessResult.session.cookie.value,
      statelessResult.session.cookie.options,
    );

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Admin login timed out") {
      return createLoginErrorResponse(
        request,
        "طلب تسجيل الدخول استغرق وقتًا طويلًا. تأكد من متغيرات الأدمن أو اتصال قاعدة البيانات.",
        504,
      );
    }

    const { userError } = await processError(error, {
      metadata: { action: "adminLogin" },
    });

    return createLoginErrorResponse(request, userError.message);
  }
}
