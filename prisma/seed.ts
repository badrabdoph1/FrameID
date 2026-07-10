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

  for (const paymentSettings of seedData.paymentSettings) {
    const settings = await prisma.paymentSettings.upsert({
      where: { paymentMethod: paymentSettings.paymentMethod },
      update: {
        isActive: paymentSettings.isActive,
        label: paymentSettings.label,
        description: paymentSettings.description,
        config: paymentSettings.config as Prisma.InputJsonValue,
        sortOrder: paymentSettings.sortOrder,
      },
      create: {
        paymentMethod: paymentSettings.paymentMethod,
        isActive: paymentSettings.isActive,
        label: paymentSettings.label,
        description: paymentSettings.description,
        config: paymentSettings.config as Prisma.InputJsonValue,
        sortOrder: paymentSettings.sortOrder,
      },
      select: { id: true },
    });

    for (const account of paymentSettings.accounts) {
      const accountIdentifier = account.accountNumber;
      const existingAccount = await prisma.paymentAccount.findFirst({
        where: {
          paymentSettingsId: settings.id,
          accountIdentifier,
        },
        select: { id: true },
      });

      const data = {
        label: account.label,
        accountIdentifier,
        instructions: account.instructions,
        sortOrder: account.sortOrder,
        isActive: true,
      };

      if (existingAccount) {
        await prisma.paymentAccount.update({
          where: { id: existingAccount.id },
          data,
        });
      } else {
        await prisma.paymentAccount.create({
          data: {
            paymentSettingsId: settings.id,
            ...data,
          },
        });
      }
    }
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
            phone: input.phone,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
            deletedAt: null
          },
          create: {
            email: input.email,
            phone: input.phone,
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash
          }
        });
        await prisma.adminUser.upsert({
          where: { email: input.email },
          update: {
            name: input.name,
            phone: input.phone,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
          },
          create: {
            email: input.email,
            phone: input.phone,
            name: input.name,
            role: "SUPER_ADMIN",
            passwordHash: input.passwordHash,
          },
        });
      }
    },
    email: process.env.SEED_SUPER_ADMIN_EMAIL,
    phone: process.env.SEED_SUPER_ADMIN_PHONE,
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
