import { redirect } from "next/navigation";
import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";

const ADMIN_SESSION_COOKIE_NAME = "frameid_admin_session";

export async function getCurrentAdmin() {
  const { cookies } = await import("next/headers");
  const { hashAdminSessionToken } = await import("@/modules/admin/admin-session-tokens");
  const { prisma } = await import("@/lib/prisma");

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

  const { getCurrentRequestUserSession: getSession } = await import("@/modules/auth/request-session");
  const oldSession = await getSession();

  if (oldSession) {
    if (canAccessSuperAdmin(oldSession.user.role)) {
      return oldSession;
    }
    redirect("/admin/login");
  }

  redirect("/admin/login");
}
