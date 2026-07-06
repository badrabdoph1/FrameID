import type {
  CurrentSession,
  CurrentSessionRepository
} from "@/modules/auth/current-session-service";

type PrismaCurrentSessionClient = {
  session: {
    findFirst(input: unknown): Promise<unknown>;
  };
};

type RawCurrentSessionRecord = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    ownedTenants: Array<{
      id: string;
      displayName: string;
      status: string;
      trialEndsAt: Date;
      sites: Array<{
        id: string;
        slug: string;
        title: string;
        status: string;
        slugChangeUsed: boolean;
      }>;
      subscriptions: Array<{
        id: string;
        status: string;
        currentPeriodEnd: Date | null;
      }>;
    }>;
  };
};

export function createPrismaCurrentSessionRepository(
  prisma: PrismaCurrentSessionClient
): CurrentSessionRepository {
  return {
    async findActiveSessionByTokenHash(tokenHash, now) {
      const session = (await prisma.session.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: {
            gt: now
          },
          user: {
            deletedAt: null
          }
        },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              ownedTenants: {
                where: {
                  deletedAt: null
                },
                orderBy: {
                  createdAt: "asc"
                },
                take: 1,
                select: {
                  id: true,
                  displayName: true,
                  status: true,
                  trialEndsAt: true,
                  sites: {
                    where: {
                      deletedAt: null
                    },
                    orderBy: {
                      createdAt: "asc"
                    },
                    take: 1,
                    select: {
                      id: true,
                      slug: true,
                      title: true,
                      status: true,
                      slugChangeUsed: true
                    }
                  },
                  subscriptions: {
                    where: {
                      deletedAt: null
                    },
                    orderBy: {
                      createdAt: "desc"
                    },
                    take: 1,
                    select: {
                      id: true,
                      status: true,
                      currentPeriodEnd: true
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

      if (!session || !tenant || !site) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        },
        tenant: {
          id: tenant.id,
          displayName: tenant.displayName,
          status: tenant.status as CurrentSession["tenant"]["status"],
          trialEndsAt: tenant.trialEndsAt
        },
        site: {
          ...site,
          status: site.status as CurrentSession["site"]["status"]
        },
        subscription: tenant.subscriptions[0]
          ? {
              ...tenant.subscriptions[0],
              status: tenant.subscriptions[0]
                .status as NonNullable<CurrentSession["subscription"]>["status"]
            }
          : null
      };
    }
  };
}
