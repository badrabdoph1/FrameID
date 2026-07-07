import { createHash, randomBytes } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "frameid_admin_session";
export const ADMIN_SESSION_TTL_DAYS = 30;

export type AdminSessionCookie = {
  name: typeof ADMIN_SESSION_COOKIE_NAME;
  value: string;
  options: {
    expires: Date;
    httpOnly: true;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  };
};

export function createRawAdminSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAdminSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function getAdminSessionExpiresAt(now: Date, ttlDays = ADMIN_SESSION_TTL_DAYS): Date {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + ttlDays);
  return expiresAt;
}

export function buildAdminSessionCookie(
  rawToken: string,
  expiresAt: Date,
  options: { secure?: boolean } = {}
): AdminSessionCookie {
  return {
    name: ADMIN_SESSION_COOKIE_NAME,
    value: rawToken,
    options: {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: options.secure ?? process.env.NODE_ENV === "production",
    },
  };
}
