import { Prisma, PrismaClient } from "@prisma/client";

import { getPlatformSeedData } from "../src/modules/setup/platform-seed-data";
import { seedSuperAdminUser } from "../src/modules/setup/super-admin-seed-service";

const prisma = new PrismaClient();

async function main() {
  const seedData = getPlatformSeedData();

  for (const theme of seedData.themes) {
    await prisma.theme.upsert({
      where: { code: theme.code },
      update: {
        name: theme.name,
        status: theme.status,
        version: theme.version,
        category: theme.category,
        defaultConfig: theme.defaultConfig as Prisma.InputJsonValue,
        contentSchema: theme.contentSchema as Prisma.InputJsonValue
      },
      create: {
        ...theme,
        defaultConfig: theme.defaultConfig as Prisma.InputJsonValue,
        contentSchema: theme.contentSchema as Prisma.InputJsonValue
      }
    });
  }

  for (const template of seedData.templates) {
    const theme = await prisma.theme.findUniqueOrThrow({
      where: { code: template.themeCode },
      select: { id: true }
    });

    await prisma.template.upsert({
      where: { code: template.code },
      update: {
        themeId: theme.id,
        name: template.name,
        status: template.status,
        showroomOrder: template.showroomOrder,
        previewData: template.previewData as Prisma.InputJsonValue,
        settings: template.settings as Prisma.InputJsonValue
      },
      create: {
        themeId: theme.id,
        code: template.code,
        name: template.name,
        status: template.status,
        showroomOrder: template.showroomOrder,
        previewData: template.previewData as Prisma.InputJsonValue,
        settings: template.settings as Prisma.InputJsonValue
      }
    });
  }

  for (const plan of seedData.plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceAmount: plan.priceAmount,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        features: plan.features as Prisma.InputJsonValue,
        isActive: plan.isActive
      },
      create: {
        ...plan,
        features: plan.features as Prisma.InputJsonValue
      }
    });
  }

  for (const settings of seedData.backupSettings) {
    await prisma.backupSettings.upsert({
      where: { type: settings.type },
      update: settings,
      create: settings
    });
  }

  await seedSuperAdmin();
}

async function seedSuperAdmin() {
  await seedSuperAdminUser({
    repository: {
      async upsertSuperAdmin(input) {
        await prisma.user.upsert({
          where: { email: input.email },
          update: {
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
            deletedAt: null
          },
          create: {
            email: input.email,
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash
          }
        });
      }
    },
    email: process.env.SEED_SUPER_ADMIN_EMAIL,
    password: process.env.SEED_SUPER_ADMIN_PASSWORD
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
