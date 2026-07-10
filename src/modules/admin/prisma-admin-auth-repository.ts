import type { AdminLoginRepository } from "@/modules/admin/admin-auth-service";

const ADMIN_LOGIN_ROLES = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "BILLING_MANAGER",
  "TEMPLATE_MANAGER",
  "SUPPORT_AGENT",
  "SECURITY_AUDITOR",
];

type AdminAuthRecord = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: string;
  passwordHash: string | null;
};

type PrismaAdminAuthClient = {
  adminUser: {
    findFirst(input: unknown): Promise<AdminAuthRecord | null>;
    upsert(input: unknown): Promise<AdminAuthRecord>;
  };
  user: {
    findFirst(input: unknown): Promise<AdminAuthRecord | null>;
  };
  adminSession: {
    create(input: unknown): Promise<{
      id: string;
      adminUserId: string;
      expiresAt: Date;
    }>;
  };
};

const ADMIN_AUTH_SELECT = {
  id: true,
  email: true,
  phone: true,
  name: true,
  role: true,
  passwordHash: true,
};

export function createPrismaAdminAuthRepository(
  prisma: PrismaAdminAuthClient
): AdminLoginRepository {
  return {
    async findAdminByEmail(email) {
      const normalizedEmail = email.trim().toLowerCase();
      const adminWhere = { email: normalizedEmail };
      const legacyWhere = {
        deletedAt: null,
        role: { in: ADMIN_LOGIN_ROLES },
        email: normalizedEmail,
      };

      const [adminUser, legacyAdminUser] = await Promise.all([
        prisma.adminUser.findFirst({
          where: adminWhere,
          select: ADMIN_AUTH_SELECT,
        }),
        prisma.user.findFirst({
          where: legacyWhere,
          select: ADMIN_AUTH_SELECT,
        }),
      ]);

      if (legacyAdminUser?.passwordHash) {
        const shouldMirrorLegacyAdmin =
          !adminUser ||
          adminUser.passwordHash !== legacyAdminUser.passwordHash ||
          adminUser.name !== legacyAdminUser.name ||
          adminUser.role !== legacyAdminUser.role ||
          adminUser.phone !== legacyAdminUser.phone;

        if (shouldMirrorLegacyAdmin) {
          return prisma.adminUser.upsert({
            where: { email: legacyAdminUser.email },
            update: {
              name: legacyAdminUser.name,
              phone: legacyAdminUser.phone,
              role: legacyAdminUser.role,
              passwordHash: legacyAdminUser.passwordHash,
            },
            create: {
              email: legacyAdminUser.email,
              phone: legacyAdminUser.phone,
              name: legacyAdminUser.name,
              role: legacyAdminUser.role,
              passwordHash: legacyAdminUser.passwordHash,
            },
            select: ADMIN_AUTH_SELECT,
          });
        }
      }

      return adminUser;
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
