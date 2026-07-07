import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants";
import { hashAdminSessionToken } from "@/modules/admin/admin-session-tokens";
import { prisma } from "@/lib/prisma";

export type CurrentAdmin = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    redirect("/admin/login");
  }

  const tokenHash = hashAdminSessionToken(rawToken);
  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      adminUser: {
        select: { id: true, email: true, name: true, role: true },
      },
    },
  });

  if (!session) {
    redirect("/admin/login");
  }

  return session.adminUser;
}
