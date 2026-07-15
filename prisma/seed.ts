import { Prisma, PrismaClient, PlatformPageKind } from "@prisma/client";

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
      const storedAccount = account as unknown as Record<string, unknown>;
      const optionalText = (key: string) => typeof storedAccount[key] === "string" ? storedAccount[key] as string : null;
      const accountIdentifier = optionalText("accountIdentifier")
        ? optionalText("accountIdentifier") as string
        : account.accountNumber;
      const existingAccount = await prisma.paymentAccount.findFirst({
        where: {
          method: paymentSettings.paymentMethod,
          accountIdentifier,
          deletedAt: null,
        },
        select: { id: true },
      });

      const data = {
        paymentSettingsId: settings.id,
        method: paymentSettings.paymentMethod,
        displayName: optionalText("displayName") || account.label || paymentSettings.label,
        accountIdentifier,
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        phoneNumber: account.phoneNumber,
        label: account.label,
        iban: optionalText("iban"),
        swift: optionalText("swift"),
        bankName: optionalText("bankName"),
        instructions: optionalText("instructions"),
        notes: optionalText("notes"),
        isActive: typeof storedAccount.isActive === "boolean" ? storedAccount.isActive : paymentSettings.isActive,
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

  for (const flag of seedData.featureFlags) {
    const existing = await prisma.featureFlag.findFirst({
      where: { key: flag.key, scope: "PLATFORM", tenantId: null, siteId: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.featureFlag.update({ where: { id: existing.id }, data: { enabled: flag.enabled, value: flag.value as Prisma.InputJsonValue } });
    } else {
      await prisma.featureFlag.create({ data: { key: flag.key, scope: "PLATFORM", tenantId: null, siteId: null, enabled: flag.enabled, value: flag.value as Prisma.InputJsonValue } });
    }
  }

  for (const message of seedData.platformMessages) {
    await prisma.notificationLog.updateMany({ where: { tenantId: null, category: message.category, title: message.title, deletedAt: null }, data: { deletedAt: new Date() } });
    await prisma.notificationLog.create({ data: { tenantId: null, category: message.category, type: message.type, title: message.title, body: message.body } });
  }

  for (const page of seedData.platformPages) {
    await prisma.platformPage.upsert({
      where: { key: page.key },
      update: {
        route: page.route,
        kind: page.kind as PlatformPageKind,
        document: page.document as Prisma.InputJsonValue,
        version: page.version,
        schemaVersion: page.schemaVersion,
      },
      create: {
        key: page.key,
        route: page.route,
        kind: page.kind as PlatformPageKind,
        document: page.document as Prisma.InputJsonValue,
        version: page.version,
        schemaVersion: page.schemaVersion,
      },
    });
  }

  const backupSettingsData = [
    { type: "DATABASE", enabled: true, schedule: "كل 12 ساعة", retentionCount: 20, nextRunAt: new Date(Date.now() + 12 * 60 * 60 * 1000) },
    { type: "FULL", enabled: true, schedule: "كل 48 ساعة", retentionCount: 10, nextRunAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
  ];
  const hasCustomerData = await prisma.tenant.count({ where: { deletedAt: null } }) > 0
    || await prisma.site.count({ where: { deletedAt: null } }) > 0;
  for (const setting of backupSettingsData) {
    await prisma.backupSettings.upsert({
      where: { type: setting.type },
      update: { enabled: setting.enabled, schedule: setting.schedule, retentionCount: setting.retentionCount, ...(!hasCustomerData ? { nextRunAt: setting.nextRunAt } : {}) },
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
