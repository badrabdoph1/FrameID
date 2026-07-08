import type {
  PaymentSettingsRepository,
  PaymentMethodWithAccounts,
  PaymentAccountItem,
  PaymentSettingsData,
  PaymentAccountData,
} from "@/modules/billing/payment-settings-service";

type PrismaPaymentClient = {
  paymentSettings: {
    findMany(input: unknown): Promise<unknown[]>;
    findUnique(input: unknown): Promise<unknown | null>;
    update(input: unknown): Promise<unknown>;
  };
  paymentAccount: {
    create(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<unknown>;
  };
};

function transformSettings(
  row: Record<string, unknown>,
): PaymentMethodWithAccounts {
  const qrAsset = row.qrCodeAsset as Record<string, unknown> | null;
  return {
    id: row.id as string,
    paymentMethod: row.paymentMethod as PaymentMethodWithAccounts["paymentMethod"],
    isActive: row.isActive as boolean,
    label: (row.label as string) ?? null,
    description: (row.description as string) ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
    qrCodeAssetId: (row.qrCodeAssetId as string) ?? null,
    qrCodeUrl: qrAsset?.url ? (qrAsset.url as string) : null,
    sortOrder: (row.sortOrder as number) ?? 0,
    accounts: ((row.accounts as Record<string, unknown>[]) ?? []).map(
      (a): PaymentAccountItem => ({
        id: a.id as string,
        paymentSettingsId: a.paymentSettingsId as string,
        label: (a.label as string) ?? null,
        accountName: a.accountName as string,
        accountNumber: a.accountNumber as string,
        bankName: (a.bankName as string) ?? null,
        iban: (a.iban as string) ?? null,
        swift: (a.swift as string) ?? null,
        phoneNumber: (a.phoneNumber as string) ?? null,
        instructions: (a.instructions as string) ?? null,
        notes: (a.notes as string) ?? null,
        isActive: a.isActive as boolean,
        sortOrder: (a.sortOrder as number) ?? 0,
      }),
    ),
  };
}

const settingsInclude = {
  accounts: {
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" as const },
  },
  qrCodeAsset: {
    select: { url: true },
  },
};

export function createPrismaPaymentSettingsRepository(
  prisma: PrismaPaymentClient,
): PaymentSettingsRepository {
  return {
    async getActivePaymentMethods() {
      const rows = (await prisma.paymentSettings.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: settingsInclude,
      })) as Record<string, unknown>[];
      return rows.map(transformSettings);
    },

    async getPaymentMethod(method: string) {
      const row = (await prisma.paymentSettings.findUnique({
        where: { paymentMethod: method as never },
        include: settingsInclude,
      })) as Record<string, unknown> | null;
      return row ? transformSettings(row) : null;
    },

    async getAllPaymentMethods() {
      const rows = (await prisma.paymentSettings.findMany({
        orderBy: { sortOrder: "asc" },
        include: settingsInclude,
      })) as Record<string, unknown>[];
      return rows.map(transformSettings);
    },

    async updatePaymentSettings(id: string, data: Partial<PaymentSettingsData>) {
      await prisma.paymentSettings.update({
        where: { id },
        data,
      });
    },

    async togglePaymentMethod(id: string, isActive: boolean) {
      await prisma.paymentSettings.update({
        where: { id },
        data: { isActive },
      });
    },

    async addPaymentAccount(settingsId: string, data: PaymentAccountData) {
      const account = (await prisma.paymentAccount.create({
        data: {
          paymentSettingsId: settingsId,
          label: data.label || null,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankName: data.bankName || null,
          iban: data.iban || null,
          swift: data.swift || null,
          phoneNumber: data.phoneNumber || null,
          instructions: data.instructions || null,
          notes: data.notes || null,
          sortOrder: data.sortOrder ?? 0,
        },
        select: { id: true },
      })) as { id: string };
      return { id: account.id };
    },

    async updatePaymentAccount(id: string, data: Partial<PaymentAccountData>) {
      const updateData: Record<string, unknown> = {};
      if (data.label !== undefined) updateData.label = data.label || null;
      if (data.accountName !== undefined) updateData.accountName = data.accountName;
      if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
      if (data.bankName !== undefined) updateData.bankName = data.bankName || null;
      if (data.iban !== undefined) updateData.iban = data.iban || null;
      if (data.swift !== undefined) updateData.swift = data.swift || null;
      if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber || null;
      if (data.instructions !== undefined) updateData.instructions = data.instructions || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
      await prisma.paymentAccount.update({
        where: { id },
        data: updateData,
      });
    },

    async deletePaymentAccount(id: string) {
      await prisma.paymentAccount.update({
        where: { id },
        data: { isActive: false },
      });
    },

    async updateQRCode(settingsId: string, assetId: string | null) {
      await prisma.paymentSettings.update({
        where: { id: settingsId },
        data: { qrCodeAssetId: assetId },
      });
    },
  };
}
