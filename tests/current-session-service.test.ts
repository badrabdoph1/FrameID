import { describe, expect, it } from "vitest";

import {
  getCurrentSession,
  type CurrentSessionRepository
} from "@/modules/auth/current-session-service";
import { hashSessionToken } from "@/modules/auth/session-tokens";

describe("current session service", () => {
  it("hashes the raw cookie token before looking up the active session", async () => {
    let receivedTokenHash = "";
    const repository: CurrentSessionRepository = {
      async findActiveSessionByTokenHash(tokenHash) {
        receivedTokenHash = tokenHash;
        return {
          user: {
            id: "user_1",
            email: "ali@example.com",
            name: "Ali Ahmed",
            role: "USER"
          },
          tenant: {
            id: "tenant_1",
            displayName: "Ali Ahmed",
            status: "TRIAL",
            trialEndsAt: new Date("2026-07-20T12:00:00.000Z")
          },
          site: {
            id: "site_1",
            slug: "ali-ahmed",
            title: "Ali Ahmed",
            status: "PUBLISHED",
            slugChangeUsed: false
          },
          subscription: {
            id: "subscription_1",
            status: "TRIAL",
            currentPeriodEnd: new Date("2026-07-20T12:00:00.000Z")
          }
        };
      }
    };

    const session = await getCurrentSession({
      repository,
      rawToken: "raw-session-token",
      now: new Date("2026-07-06T12:00:00.000Z")
    });

    expect(receivedTokenHash).toBe(hashSessionToken("raw-session-token"));
    expect(session?.site.slug).toBe("ali-ahmed");
  });

  it("returns null when no raw token exists", async () => {
    const repository: CurrentSessionRepository = {
      async findActiveSessionByTokenHash() {
        throw new Error("should not query without a token");
      }
    };

    await expect(
      getCurrentSession({ repository, rawToken: "", now: new Date() })
    ).resolves.toBeNull();
  });
});
