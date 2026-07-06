import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "frameid_session";
export const SESSION_TTL_DAYS = 30;

export type SessionCookie = {
  name: typeof SESSION_COOKIE_NAME;
  value: string;
  options: {
    expires: Date;
    httpOnly: true;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  };
};

export function createRawSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function getSessionExpiresAt(now: Date, ttlDays = SESSION_TTL_DAYS): Date {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + ttlDays);
  return expiresAt;
}

export function buildSessionCookie(
  rawToken: string,
  expiresAt: Date,
  options: { secure?: boolean } = {}
): SessionCookie {
  return {
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    options: {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: options.secure ?? process.env.NODE_ENV === "production"
    }
  };
}
