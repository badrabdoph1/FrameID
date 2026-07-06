import { describe, expect, it } from "vitest";

import { createPrismaCurrentSessionRepository } from "@/modules/auth/prisma-current-session-repository";

describe("prisma current session repository", () => {
  it("loads the active session owner, first tenant, first site and latest subscription", async () => {
    const prisma = {
      session: {
        async findFirst(args: {
          where: {
            tokenHash: string;
            revokedAt: null;
            expiresAt: { gt: Date };
          };
        }) {
          expect(args.where.tokenHash).toBe("hashed-token");
          expect(args.where.revokedAt).toBeNull();
          expect(args.where.expiresAt.gt.toISOString()).toBe(
            "2026-07-06T12:00:00.000Z"
          );

          return {
            user: {
              id: "user_1",
              email: "ali@example.com",
              name: "Ali Ahmed",
              role: "USER",
              ownedTenants: [
                {
                  id: "tenant_1",
                  displayName: "Ali Ahmed Studio",
                  status: "TRIAL",
                  trialEndsAt: new Date("2026-07-20T12:00:00.000Z"),
                  sites: [
                    {
                      id: "site_1",
                      slug: "ali-ahmed",
                      title: "Ali Ahmed",
                      status: "PUBLISHED",
                      slugChangeUsed: false
                    }
                  ],
                  subscriptions: [
                    {
                      id: "subscription_1",
                      status: "TRIAL",
                      currentPeriodEnd: new Date("2026-07-20T12:00:00.000Z")
                    }
                  ]
                }
              ]
            }
          };
        }
      }
    };
    const repository = createPrismaCurrentSessionRepository(prisma);

    await expect(
      repository.findActiveSessionByTokenHash(
        "hashed-token",
        new Date("2026-07-06T12:00:00.000Z")
      )
    ).resolves.toMatchObject({
      user: {
        id: "user_1"
      },
      tenant: {
        id: "tenant_1"
      },
      site: {
        slug: "ali-ahmed"
      },
      subscription: {
        id: "subscription_1",
        status: "TRIAL"
      }
    });
  });
});
