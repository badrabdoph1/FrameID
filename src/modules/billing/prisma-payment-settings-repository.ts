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
    findMany(input: unknown): Promise<unknown[]>;
    create(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<unknown>;
  };
};

export function createPrismaPaymentSettingsRepository(
  prisma: PrismaPaymentClient,
): PaymentSettingsRepository {
  async function getAccountsGroupedByMethod(onlyActive: boolean) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (onlyActive) where.isActive = true;

    const accounts = (await prisma.paymentAccount.findMany({
      where,
      orderBy: [{ method: "asc" as const }, { sortOrder: "asc" as const }],
    })) as Record<string, unknown>[];

    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const account of accounts) {
      const method = account.method as string;
      if (!grouped.has(method)) grouped.set(method, []);
      grouped.get(method)!.push(account);
    }

    const labelMap: Record<string, string> = { INSTAPAY: "إنستا باي", VODAFONE_CASH: "فودافون كاش", STRIPE: "Stripe", PAYPAL: "PayPal" };
    return Array.from(grouped.entries()).map(([method, methodAccounts]) => ({
      id: `method-${method}`,
      paymentMethod: method as PaymentMethodWithAccounts["paymentMethod"],
      isActive: true,
      label: labelMap[method] ?? method,
      description: method === "INSTAPAY" ? "تحويل فوري عبر تطبيق InstaPay ثم رفع صورة إثبات الدفع." : method === "VODAFONE_CASH" ? "تحويل يدوي عبر Vodafone Cash ثم رفع صورة إثبات الدفع." : null,
      config: {},
      qrCodeAssetId: null,
      qrCodeUrl: null,
      sortOrder: method === "INSTAPAY" ? 10 : method === "VODAFONE_CASH" ? 20 : 30,
      accounts: methodAccounts.map((a) => ({
        id: a.id as string,
        paymentSettingsId: a.paymentSettingsId as string ?? "",
        label: (a.label as string) ?? (a.displayName as string) ?? null,
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
      })),
    }));
  }

  return {
    async getActivePaymentMethods() {
      return getAccountsGroupedByMethod(true);
    },

    async getPaymentMethod(method: string) {
      const methods = await getAccountsGroupedByMethod(false);
      return methods.find((m) => m.paymentMethod === method) ?? null;
    },

    async getAllPaymentMethods() {
      return getAccountsGroupedByMethod(false);
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
