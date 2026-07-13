import { templateDefinitions, themeDefinitions } from "@/modules/themes/definitions";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function getPlatformSeedData() {
  const baseline = {
    themes: themeDefinitions.map((theme) => ({
      code: theme.code,
      name: theme.name,
      status: theme.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      version: theme.version,
      category: "photography",
      defaultConfig: theme.defaultConfig,
      contentSchema: {
        supportedSections: theme.supportedSections
      }
    })),
    templates: templateDefinitions.map((template) => {
      return {
        code: template.code,
        themeCode: template.themeCode,
        name: template.name,
        status: template.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        version: themeDefinitions.find((theme) => theme.code === template.themeCode)?.version ?? "1.0.0",
        showroomOrder: template.showroomOrder,
        previewData: null,
        settings: template.starterContent.themeSettings
      };
    }),
    plans: [
      {
        code: "basic",
        name: "الباقة الأساسية",
        priceAmount: 59900,
        currency: "EGP",
        billingInterval: "monthly",
        features: {
          publicSite: true,
          dashboard: true,
          themes: 1,
          galleryImages: 100,
          customDomain: false,
          priority: "standard",
          manualActivation: true,
          storage: "1 GB",
        },
        isActive: true
      },
      {
        code: "professional",
        name: "الباقة الاحترافية",
        priceAmount: 99900,
        currency: "EGP",
        billingInterval: "monthly",
        features: {
          publicSite: true,
          dashboard: true,
          themes: 3,
          galleryImages: 500,
          customDomain: true,
          priority: "high",
          manualActivation: true,
          storage: "5 GB",
        },
        isActive: true
      },
      {
        code: "premium",
        name: "الباقة الماسية",
        priceAmount: 169900,
        currency: "EGP",
        billingInterval: "monthly",
        features: {
          publicSite: true,
          dashboard: true,
          themes: 10,
          galleryImages: 9999,
          customDomain: true,
          priority: "vip",
          manualActivation: true,
          storage: "20 GB",
        },
        isActive: false
      },
    ],
    paymentSettings: [
      {
        paymentMethod: "INSTAPAY" as const,
        isActive: true,
        label: "إنستا باي",
        description: "تحويل فوري عبر تطبيق InstaPay ثم رفع صورة إثبات الدفع.",
        config: { providerType: "MANUAL_TRANSFER", proofRequired: true, supportsQrCode: true },
        sortOrder: 10,
        accounts: [
          {
            label: "حساب إنستا باي الرئيسي",
            accountName: "Badr A** B** H****",
            accountNumber: "01011511561",
            phoneNumber: "01011511561",
            instructions: "حوّل على رقم إنستا باي، ثم ارفع صورة إثبات الدفع من نفس الصفحة.",
            sortOrder: 10,
          },
        ],
      },
      {
        paymentMethod: "VODAFONE_CASH" as const,
        isActive: true,
        label: "فودافون كاش",
        description: "تحويل يدوي عبر Vodafone Cash ثم رفع صورة إثبات الدفع.",
        config: { providerType: "MANUAL_WALLET", proofRequired: true, supportsQrCode: true },
        sortOrder: 20,
        accounts: [
          {
            label: "محفظة فودافون كاش الرئيسية",
            accountName: "Badr A** B** H****",
            accountNumber: "01038434472",
            phoneNumber: "01038434472",
            instructions: "حوّل على رقم فودافون كاش، ثم ارفع صورة إثبات الدفع من نفس الصفحة.",
            sortOrder: 10,
          },
        ],
      },
      {
        paymentMethod: "STRIPE" as const,
        isActive: false,
        label: "Stripe",
        description: "جاهز للتفعيل مستقبلاً للبطاقات والمدفوعات الدولية.",
        config: { providerType: "HOSTED_CHECKOUT", proofRequired: false },
        sortOrder: 30,
        accounts: [],
      },
      {
        paymentMethod: "PAYPAL" as const,
        isActive: false,
        label: "PayPal",
        description: "جاهز للتفعيل مستقبلاً للمحافظ العالمية.",
        config: { providerType: "HOSTED_CHECKOUT", proofRequired: false },
        sortOrder: 40,
        accounts: [],
      },
    ],
    featureFlags: [] as Array<{ key: string; enabled: boolean; value: unknown }>,
    platformMessages: [] as Array<{ category: string | null; type: string; title: string; body: string | null }>,
  };
  const configPath = join(process.cwd(), "content", "platform", "admin-config.json");
  if (!existsSync(configPath)) return baseline;
  try {
    const saved = JSON.parse(readFileSync(configPath, "utf8")) as Partial<typeof baseline>;
    return {
      themes: Array.isArray(saved.themes) && saved.themes.length ? saved.themes : baseline.themes,
      templates: Array.isArray(saved.templates) && saved.templates.length ? saved.templates : baseline.templates,
      plans: Array.isArray(saved.plans) && saved.plans.length ? saved.plans : baseline.plans,
      paymentSettings: Array.isArray(saved.paymentSettings) && saved.paymentSettings.length ? saved.paymentSettings : baseline.paymentSettings,
      featureFlags: Array.isArray(saved.featureFlags) ? saved.featureFlags : baseline.featureFlags,
      platformMessages: Array.isArray(saved.platformMessages) ? saved.platformMessages : baseline.platformMessages,
    } as typeof baseline;
  } catch {
    return baseline;
  }
}
