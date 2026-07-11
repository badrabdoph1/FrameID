import { redirect } from "next/navigation";
import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";
import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants";

export async function getCurrentAdmin() {
  const { cookies } = await import("next/headers");
  const { hashAdminSessionToken, verifySignedAdminSessionToken } = await import("@/modules/admin/admin-session-tokens");
  const { prisma } = await import("@/lib/prisma");

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const signedPayload = verifySignedAdminSessionToken(rawToken);
  if (signedPayload) {
    return {
      id: signedPayload.id,
      email: signedPayload.email,
      name: signedPayload.name,
      role: signedPayload.role,
      createdAt: new Date(signedPayload.exp),
      updatedAt: new Date(signedPayload.exp),
      passwordHash: null,
    };
  }

  const tokenHash = hashAdminSessionToken(rawToken);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session?.user) return null;

  return session.user;
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
