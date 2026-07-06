"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens";

export async function logoutAction() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const { hashSessionToken } = await import("@/modules/auth/session-tokens");
    const tokenHash = hashSessionToken(rawToken);

    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  redirect("/");
}
