import type { LoginRepository } from "@/modules/auth/login-service";

type PrismaLoginClient = {
  user: {
    findFirst(input: unknown): Promise<{
      id: string;
      email: string;
      phone: string | null;
      name: string;
      role: string;
      passwordHash: string | null;
      deletedAt: Date | null;
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
    async findUserByIdentifier({ email, phone }) {
      return prisma.user.findFirst({
        where: {
          OR: [
            { email: email.trim().toLowerCase() },
            ...(phone ? [{ phone }] : [])
          ]
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          passwordHash: true,
          deletedAt: true,
        },
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
