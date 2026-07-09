import { verifyPassword } from "@/modules/auth/password-hashing";
import { parseEmailOrPhoneIdentifier } from "@/modules/auth/auth-identifier";
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
  phone: string | null;
  name: string;
  role: string;
};

export type AdminSessionRecord = {
  id: string;
  adminUserId: string;
  expiresAt: Date;
};

export type AdminLoginRepository = {
  findAdminByIdentifier(input: { email: string; phone: string | null }): Promise<
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
    async login(input: { identifier?: string; email?: string; password: string }): Promise<AdminLoginResult> {
      const identifier = parseEmailOrPhoneIdentifier(input.identifier || input.email || "");
      const admin = await repository.findAdminByIdentifier({
        email: identifier.storageEmail,
        phone: identifier.phone
      });

      if (!admin?.passwordHash) {
        throw new Error("Invalid phone/email or password");
      }

      const isValid = await verifyPassword(input.password, admin.passwordHash);
      if (!isValid) {
        throw new Error("Invalid phone/email or password");
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
        admin: { id: admin.id, email: admin.email, phone: admin.phone, name: admin.name, role: admin.role },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          cookie: buildAdminSessionCookie(rawToken, session.expiresAt),
        },
      };
    },
  };
}
