import { redirect } from "next/navigation";

import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";
import { getCurrentRequestUserSession } from "@/modules/auth/request-session";

export async function requireSuperAdminSession() {
  const session = await getCurrentRequestUserSession();

  if (!session) {
    redirect("/login");
  }

  if (!canAccessSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}
