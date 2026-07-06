import { describe, expect, it } from "vitest";

import {
  createSessionForUser,
  type SessionRepository
} from "@/modules/auth/session-service";

describe("session service", () => {
  it("creates a persisted hashed session and returns only the raw token in the cookie", async () => {
    let storedTokenHash = "";
    const repository: SessionRepository = {
      async createSession(input) {
        storedTokenHash = input.tokenHash;
        return {
          id: "session_1",
          userId: input.userId,
          expiresAt: input.expiresAt
        };
      }
    };

    const result = await createSessionForUser({
      repository,
      userId: "user_1",
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    expect(result.id).toBe("session_1");
    expect(result.cookie.value).not.toBe(storedTokenHash);
    expect(result.cookie.options.expires.toISOString()).toBe(
      "2026-08-05T12:00:00.000Z"
    );
  });
});
