import { describe, expect, it } from "vitest";

import {
  getCurrentUserSession,
  getCurrentSession,
  getPostLoginRedirectPath,
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

  it("loads an active user session without requiring tenant-owned site data", async () => {
    let receivedTokenHash = "";
    const repository = {
      async findActiveUserByTokenHash(tokenHash: string) {
        receivedTokenHash = tokenHash;
        return {
          user: {
            id: "admin_1",
            email: "admin@example.com",
            name: "FrameID Admin",
            role: "SUPER_ADMIN"
          }
        };
      }
    };

    const session = await getCurrentUserSession({
      repository,
      rawToken: "raw-admin-session-token",
      now: new Date("2026-07-06T12:00:00.000Z")
    });

    expect(receivedTokenHash).toBe(hashSessionToken("raw-admin-session-token"));
    expect(session?.user.role).toBe("SUPER_ADMIN");
  });

  it("sends admin roles to the admin console after login", () => {
    expect(getPostLoginRedirectPath("SUPER_ADMIN")).toBe("/admin");
    expect(getPostLoginRedirectPath("USER")).toBe("/dashboard");
  });
});
