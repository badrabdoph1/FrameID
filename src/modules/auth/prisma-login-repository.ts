import type { LoginRepository } from "@/modules/auth/login-service";

type PrismaLoginClient = {
  user: {
    findFirst(input: unknown): Promise<{
      id: string;
      email: string;
      name: string;
      role: string;
      passwordHash: string | null;
    } | null>;
  };
  session: {
    create(input: unknown): Promise<{
      id: string;
      userId: string;
      expiresAt: Date;
    }>;
  };
};

export function createPrismaLoginRepository(
  prisma: PrismaLoginClient
): LoginRepository {
  return {
    async findUserByEmail(email) {
      return prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          deletedAt: null
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true
        }
      });
    },
    async createSession(input) {
      return prisma.session.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true
        }
      });
    }
  };
}
