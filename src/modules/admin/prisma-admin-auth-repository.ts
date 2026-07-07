import type { AdminLoginRepository } from "@/modules/admin/admin-auth-service";

type PrismaAdminAuthClient = {
  adminUser: {
    findFirst(input: unknown): Promise<{
      id: string;
      email: string;
      name: string;
      role: string;
      passwordHash: string | null;
    } | null>;
  };
  adminSession: {
    create(input: unknown): Promise<{
      id: string;
      adminUserId: string;
      expiresAt: Date;
    }>;
  };
};

export function createPrismaAdminAuthRepository(
  prisma: PrismaAdminAuthClient
): AdminLoginRepository {
  return {
    async findAdminByEmail(email) {
      return prisma.adminUser.findFirst({
        where: { email: email.trim().toLowerCase() },
        select: { id: true, email: true, name: true, role: true, passwordHash: true },
      });
    },
    async createAdminSession(input) {
      return prisma.adminSession.create({
        data: {
          adminUserId: input.adminUserId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
        select: { id: true, adminUserId: true, expiresAt: true },
      });
    },
  };
}
