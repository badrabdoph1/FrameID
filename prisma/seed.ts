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
        version: template.version,
        showroomOrder: template.showroomOrder,
        previewData: template.previewData === null ? Prisma.JsonNull : template.previewData as Prisma.InputJsonValue,
        settings: template.settings as Prisma.InputJsonValue
      },
      create: {
        themeId: theme.id,
        code: template.code,
        name: template.name,
        status: template.status,
        version: template.version,
        showroomOrder: template.showroomOrder,
        previewData: template.previewData === null ? Prisma.JsonNull : template.previewData as Prisma.InputJsonValue,
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

  for (const paymentSettings of seedData.paymentSettings) {
    for (const account of paymentSettings.accounts) {
      const accountIdentifier = account.accountNumber;
      const existingAccount = await prisma.paymentAccount.findFirst({
        where: {
          method: paymentSettings.paymentMethod,
          accountIdentifier,
          deletedAt: null,
        },
        select: { id: true },
      });

      const data = {
        method: paymentSettings.paymentMethod,
        displayName: account.label || paymentSettings.label,
        accountIdentifier,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        phoneNumber: account.phoneNumber,
        isActive: paymentSettings.isActive,
        sortOrder: paymentSettings.sortOrder + account.sortOrder,
      };

      if (existingAccount) {
        await prisma.paymentAccount.update({
          where: { id: existingAccount.id },
          data,
        });
      } else {
        await prisma.paymentAccount.create({
          data,
        });
      }
    }
  }

  const backupSettingsData = [
    { type: "DATABASE", enabled: true, schedule: "0 2 * * *", retentionCount: 20 },
    { type: "FULL", enabled: true, schedule: "0 3 */3 * *", retentionCount: 10 },
  ];
  for (const setting of backupSettingsData) {
    await prisma.backupSettings.upsert({
      where: { type: setting.type },
      update: { enabled: setting.enabled, schedule: setting.schedule, retentionCount: setting.retentionCount },
      create: setting,
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
            phone: null,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
            deletedAt: null
          },
          create: {
            email: input.email,
            phone: null,
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash
          }
        });
        await prisma.adminUser.upsert({
          where: { email: input.email },
          update: {
            name: input.name,
            phone: null,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
          },
          create: {
            email: input.email,
            phone: null,
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
          },
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
