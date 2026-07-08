import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_DAYS,
} from "@/modules/admin/admin-session-constants";
import type { AdminSessionCookie } from "@/modules/admin/admin-session-constants";

export { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_TTL_DAYS, type AdminSessionCookie };

export type SignedAdminSessionPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
  exp: number;
};

const SIGNED_ADMIN_TOKEN_PREFIX = "stateless";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAdminTokenSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SEED_SUPER_ADMIN_PASSWORD ||
    "frameid-admin-session-development-secret"
  );
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getAdminTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

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

export function createSignedAdminSessionToken(
  admin: Pick<SignedAdminSessionPayload, "id" | "email" | "name" | "role">,
  expiresAt: Date,
): string {
  const payload: SignedAdminSessionPayload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    exp: expiresAt.getTime(),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${SIGNED_ADMIN_TOKEN_PREFIX}.${encodedPayload}.${signature}`;
}

export function verifySignedAdminSessionToken(token: string | undefined): SignedAdminSessionPayload | null {
  if (!token?.startsWith(`${SIGNED_ADMIN_TOKEN_PREFIX}.`)) return null;

  const [, encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SignedAdminSessionPayload;
    if (!payload.id || !payload.email || !payload.role || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
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
