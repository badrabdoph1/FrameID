import { verifyPassword } from "@/modules/auth/password-hashing";
import {
  buildAdminSessionCookie,
  createRawAdminSessionToken,
  getAdminSessionExpiresAt,
  hashAdminSessionToken,
  type AdminSessionCookie,
} from "@/modules/admin/admin-session-tokens";

export type AdminAuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AdminSessionRecord = {
  id: string;
  adminUserId: string;
  expiresAt: Date;
};

export type AdminLoginRepository = {
  findAdminByEmail(email: string): Promise<
    | (AdminAuthenticatedUser & { passwordHash: string | null })
    | null
  >;
  createAdminSession(input: {
    adminUserId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AdminSessionRecord>;
};

export type AdminLoginResult = {
  admin: AdminAuthenticatedUser;
  session: {
    id: string;
    expiresAt: Date;
    cookie: AdminSessionCookie;
  };
};

export function createAdminLoginService(repository: AdminLoginRepository) {
  return {
    async login(input: { email: string; password: string }): Promise<AdminLoginResult> {
      const admin = await repository.findAdminByEmail(input.email);

      if (!admin?.passwordHash) {
        throw new Error("البريد أو كلمة المرور غير صحيحة");
      }

      const isValid = await verifyPassword(input.password, admin.passwordHash);
      if (!isValid) {
        throw new Error("البريد أو كلمة المرور غير صحيحة");
      }

      const rawToken = createRawAdminSessionToken();
      const tokenHash = hashAdminSessionToken(rawToken);
      const expiresAt = getAdminSessionExpiresAt(new Date());

      const session = await repository.createAdminSession({
        adminUserId: admin.id,
        tokenHash,
        expiresAt,
      });

      return {
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          cookie: buildAdminSessionCookie(rawToken, session.expiresAt),
        },
      };
    },
  };
}
