"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants";

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
