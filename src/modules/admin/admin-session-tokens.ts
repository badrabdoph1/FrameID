import "server-only";
import { createHash, randomBytes } from "crypto";

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_DAYS,
} from "@/modules/admin/admin-session-constants";
import type { AdminSessionCookie } from "@/modules/admin/admin-session-constants";

export { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_TTL_DAYS, type AdminSessionCookie };

export function createRawAdminSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAdminSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function getAdminSessionExpiresAt(now: Date, ttlDays = 30): Date {
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
