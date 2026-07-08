import { redirect } from "next/navigation";

import { can, canView } from "@/modules/admin/admin-rbac";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import type { CenterAction } from "@/modules/admin/permissions";

export type CurrentAdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

export async function requireAdminPermission(
  center: string,
  action: CenterAction = "view",
): Promise<CurrentAdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!can(admin.role, center, action)) {
    redirect(`/admin?forbidden=${encodeURIComponent(`${center}:${action}`)}`);
  }

  return admin;
}

export async function requireAdminCenter(center: string): Promise<CurrentAdminUser> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!canView(admin.role, center)) {
    redirect(`/admin?forbidden=${encodeURIComponent(center)}`);
  }

  return admin;
}
