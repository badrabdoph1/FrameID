import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE_NAME, hashAdminSessionToken } from "@/modules/admin/admin-session-tokens";
import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const tokenHash = hashAdminSessionToken(rawToken);

  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { adminUser: true },
  });

  if (!session?.adminUser) return null;

  return session.adminUser;
}

export async function requireSuperAdminSession() {
  const adminUser = await getCurrentAdmin();

  if (adminUser) {
    return { user: adminUser };
  }

  const { getCurrentRequestUserSession } = await import("@/modules/auth/request-session");
  const oldSession = await getCurrentRequestUserSession();

  if (oldSession) {
    if (canAccessSuperAdmin(oldSession.user.role)) {
      return oldSession;
    }
    redirect("/admin/login");
  }

  redirect("/admin/login");
}
