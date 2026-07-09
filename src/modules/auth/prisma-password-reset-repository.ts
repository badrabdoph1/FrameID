import type { PasswordResetRepository } from "@/modules/auth/password-reset-service";

type PrismaPasswordResetClient = {
  user: {
    findFirst(input: unknown): Promise<{ id: string; email: string; phone: string | null; name: string } | null>;
    update(input: unknown): Promise<unknown>;
  };
  passwordResetToken: {
    create(input: unknown): Promise<unknown>;
    findFirst(input: unknown): Promise<{ id: string; userId: string; usedAt: Date | null; expiresAt: Date } | null>;
    update(input: unknown): Promise<unknown>;
  };
  session: {
    updateMany(input: unknown): Promise<unknown>;
  };
};

export function createPrismaPasswordResetRepository(
  prisma: PrismaPasswordResetClient
): PasswordResetRepository {
  return {
    async findUserByIdentifier({ email, phone }) {
      return prisma.user.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        }
      });
    },
    async createResetToken(input) {
      await prisma.passwordResetToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt
        }
      });
    },
    async findValidTokenByHash(tokenHash, now) {
      return prisma.passwordResetToken.findFirst({
        where: {
          tokenHash,
          expiresAt: {
            gt: now
          }
        },
        select: {
          id: true,
          userId: true,
          usedAt: true,
          expiresAt: true,
        }
      });
    },
    async updateUserPassword(input) {
      await prisma.user.update({
        where: {
          id: input.userId
        },
        data: {
          passwordHash: input.passwordHash
        }
      });
    },
    async markTokenUsed(input) {
      await prisma.passwordResetToken.update({
        where: {
          id: input.tokenId
        },
        data: {
          usedAt: input.usedAt
        }
      });
    },
    async revokeUserSessions(input) {
      await prisma.session.updateMany({
        where: {
          userId: input.userId,
          revokedAt: null
        },
        data: {
          revokedAt: input.revokedAt
        }
      });
    }
  };
}
