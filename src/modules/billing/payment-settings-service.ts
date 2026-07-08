export type PaymentMethodEnum = "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL";

export type PaymentMethodWithAccounts = {
  id: string;
  paymentMethod: PaymentMethodEnum;
  isActive: boolean;
  label: string | null;
  description: string | null;
  config: Record<string, unknown>;
  qrCodeAssetId: string | null;
  qrCodeUrl: string | null;
  sortOrder: number;
  accounts: PaymentAccountItem[];
};

export type PaymentAccountItem = {
  id: string;
  paymentSettingsId: string;
  label: string | null;
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  iban: string | null;
  swift: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PaymentSettingsData = {
  label: string;
  description: string;
  config: Record<string, unknown>;
  sortOrder: number;
};

export type PaymentAccountData = {
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swift: string;
  phoneNumber: string;
  instructions: string;
  notes: string;
  sortOrder: number;
};

export type PaymentSettingsRepository = {
  getActivePaymentMethods(): Promise<PaymentMethodWithAccounts[]>;
  getPaymentMethod(method: string): Promise<PaymentMethodWithAccounts | null>;
  getAllPaymentMethods(): Promise<PaymentMethodWithAccounts[]>;
  updatePaymentSettings(id: string, data: Partial<PaymentSettingsData>): Promise<void>;
  togglePaymentMethod(id: string, isActive: boolean): Promise<void>;
  addPaymentAccount(settingsId: string, data: PaymentAccountData): Promise<{ id: string }>;
  updatePaymentAccount(id: string, data: Partial<PaymentAccountData>): Promise<void>;
  deletePaymentAccount(id: string): Promise<void>;
  updateQRCode(settingsId: string, assetId: string | null): Promise<void>;
};

export function createPaymentSettingsService(repository: PaymentSettingsRepository) {
  return {
    async getActivePaymentMethods() {
      return repository.getActivePaymentMethods();
    },
    async getPaymentMethod(method: string) {
      if (!method) throw new Error("Payment method is required");
      return repository.getPaymentMethod(method);
    },
    async getAllPaymentMethods() {
      return repository.getAllPaymentMethods();
    },
    async updatePaymentSettings(id: string, data: Partial<PaymentSettingsData>) {
      if (!id) throw new Error("Settings ID is required");
      await repository.updatePaymentSettings(id, data);
    },
    async togglePaymentMethod(id: string, isActive: boolean) {
      if (!id) throw new Error("Settings ID is required");
      await repository.togglePaymentMethod(id, isActive);
    },
    async addPaymentAccount(settingsId: string, data: PaymentAccountData) {
      if (!settingsId) throw new Error("Settings ID is required");
      if (!data.accountName?.trim()) throw new Error("Account name is required");
      if (!data.accountNumber?.trim()) throw new Error("Account number is required");
      return repository.addPaymentAccount(settingsId, data);
    },
    async updatePaymentAccount(id: string, data: Partial<PaymentAccountData>) {
      if (!id) throw new Error("Account ID is required");
      await repository.updatePaymentAccount(id, data);
    },
    async deletePaymentAccount(id: string) {
      if (!id) throw new Error("Account ID is required");
      await repository.deletePaymentAccount(id);
    },
    async updateQRCode(settingsId: string, assetId: string | null) {
      if (!settingsId) throw new Error("Settings ID is required");
      await repository.updateQRCode(settingsId, assetId);
    },
  };
}
