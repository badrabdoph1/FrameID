import { hashAdminSessionToken } from "@/modules/admin/admin-session-tokens";

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AdminSessionRepository = {
  findActiveAdminSession(tokenHash: string, now: Date): Promise<{
    adminUser: AdminSessionUser;
  } | null>;
};

export async function getCurrentAdminSession(
  repository: AdminSessionRepository,
  rawToken: string | undefined,
  now: Date
): Promise<AdminSessionUser | null> {
  if (!rawToken) return null;

  const session = await repository.findActiveAdminSession(hashAdminSessionToken(rawToken), now);
  return session?.adminUser ?? null;
}
