import type { CurrentSession, CurrentSessionRepository, CurrentUserSession } from "@/modules/auth/current-session-service";

type PrismaCurrentSessionClient = {
  session: { findFirst(input: unknown): Promise<unknown> };
};

type RawCurrentSessionRecord = {
  user: {
    id: string;
    email: string;
    phone: string | null;
    name: string;
    role: string;
    ownedTenants: Array<{
      id: string;
      displayName: string;
      status: string;
      trialStartedAt: Date;
      trialEndsAt: Date;
      trialDays: number;
      gracePeriodEndsAt: Date | null;
      sites: Array<{ id: string; slug: string; title: string; status: string; slugChangeUsed: boolean }>;
      subscriptions: Array<{
        id: string;
        planId: string | null;
        plan: { code: string; name: string; priceAmount: number; currency: string } | null;
        status: string;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        activatedAt: Date | null;
        expiresAt: Date | null;
      }>;
    }>;
  };
};

type RawCurrentUserSessionRecord = { user: CurrentUserSession["user"] };

export function createPrismaCurrentSessionRepository(prisma: PrismaCurrentSessionClient): CurrentSessionRepository & { findActiveUserByTokenHash(tokenHash: string, now: Date): Promise<CurrentUserSession | null> } {
  return {
    async findActiveUserByTokenHash(tokenHash, now) {
      const session = (await prisma.session.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: now }, user: { deletedAt: null } },
        select: { user: { select: { id: true, email: true, phone: true, name: true, role: true } } }
      })) as RawCurrentUserSessionRecord | null;
      return session ? { user: session.user } : null;
    },

    async findActiveSessionByTokenHash(tokenHash, now) {
      const session = (await prisma.session.findFirst({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: now }, user: { deletedAt: null } },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              name: true,
              role: true,
              ownedTenants: {
                where: { deletedAt: null },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: {
                  id: true,
                  displayName: true,
                  status: true,
                  trialStartedAt: true,
                  trialEndsAt: true,
                  trialDays: true,
                  gracePeriodEndsAt: true,
                  sites: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    take: 1,
                    select: { id: true, slug: true, title: true, status: true, slugChangeUsed: true }
                  },
                  subscriptions: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                      id: true,
                      planId: true,
                      status: true,
                      currentPeriodStart: true,
                      currentPeriodEnd: true,
                      activatedAt: true,
                      expiresAt: true,
                      plan: { select: { code: true, name: true, priceAmount: true, currency: true } }
                    }
                  }
                }
              }
            }
          }
        }
      })) as RawCurrentSessionRecord | null;

      const tenant = session?.user.ownedTenants[0];
      const site = tenant?.sites[0];
      if (!session || !tenant || !site) return null;

      return {
        user: { id: session.user.id, email: session.user.email, phone: session.user.phone, name: session.user.name, role: session.user.role },
        tenant: {
          id: tenant.id,
          displayName: tenant.displayName,
          status: tenant.status as CurrentSession["tenant"]["status"],
          trialStartedAt: tenant.trialStartedAt,
          trialEndsAt: tenant.trialEndsAt,
          trialDays: tenant.trialDays,
          gracePeriodEndsAt: tenant.gracePeriodEndsAt
        },
        site: { ...site, status: site.status as CurrentSession["site"]["status"] },
        subscription: tenant.subscriptions[0]
          ? {
              id: tenant.subscriptions[0].id,
              planId: tenant.subscriptions[0].planId,
              plan: tenant.subscriptions[0].plan,
              status: tenant.subscriptions[0].status as NonNullable<CurrentSession["subscription"]>["status"],
              currentPeriodStart: tenant.subscriptions[0].currentPeriodStart,
              currentPeriodEnd: tenant.subscriptions[0].currentPeriodEnd,
              activatedAt: tenant.subscriptions[0].activatedAt,
              expiresAt: tenant.subscriptions[0].expiresAt
            }
          : null
      };
    }
  };
}
