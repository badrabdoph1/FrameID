import { describe, expect, it } from "vitest";

import {
  SESSION_COOKIE_NAME,
  buildSessionCookie,
  createRawSessionToken,
  hashSessionToken
} from "@/modules/auth/session-tokens";

describe("session tokens", () => {
  it("creates high entropy tokens and stores only a stable hash", () => {
    const token = createRawSessionToken();
    const secondToken = createRawSessionToken();
    const tokenHash = hashSessionToken(token);

    expect(token).not.toBe(secondToken);
    expect(token).toHaveLength(43);
    expect(tokenHash).toHaveLength(43);
    expect(tokenHash).toBe(hashSessionToken(token));
    expect(tokenHash).not.toBe(token);
  });

  it("builds an httpOnly same-site session cookie", () => {
    const expiresAt = new Date("2026-08-05T12:00:00.000Z");
    const cookie = buildSessionCookie("raw-token", expiresAt, {
      secure: true
    });

    expect(cookie).toEqual({
      name: SESSION_COOKIE_NAME,
      value: "raw-token",
      options: {
        expires: expiresAt,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: true
      }
    });
  });
});
