import { templateDefinitions, themeDefinitions } from "@/modules/themes/definitions";

const DEMO_HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85";

const DEMO_GALLERY = [
  {
    id: "demo-1",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=85",
    alt: "زفاف في الهواء الطلق",
    caption: "لحظة تبادل الخواتم"
  },
  {
    id: "demo-2",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=85",
    alt: "باقة ورد الزفاف",
    caption: "تفاصيل الباقة"
  },
  {
    id: "demo-3",
    url: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=800&q=85",
    alt: "جلسة تصوير زفاف",
    caption: "جلسة العروسين"
  },
  {
    id: "demo-4",
    url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=85",
    alt: "ديكور حفل زفاف",
    caption: "قاعة الزفاف"
  }
];

const DEMO_PREVIEW_DATA = {
  hero: {
    headline: "نصنع ذكريات تبقى للأبد",
    subheadline:
      "تصوير حفلات الزفاف والخطوبة والجلسات الخاصة بأسلوب فاخر يجمع بين البساطة، والإضاءة السينمائية، والألوان الطبيعية.",
    imageUrl: DEMO_HERO_IMAGE
  },
  contact: {
    callToAction: "احجز الآن",
    instagram: "bodystudio",
    facebook: "bodystudio"
  },
  packages: [
    {
      id: "bronze",
      name: "الباقة البرونزية",
      subtitle: "جلسة تصوير بسيطة",
      price: "2,500 جنيه",
      priceAmount: 2500,
      currency: "EGP",
      features: ["3 ساعات", "جميع الصور المعدلة", "معرض إلكتروني", "تسليم خلال 7 أيام"],
      isHighlighted: false
    },
    {
      id: "silver",
      name: "الباقة الفضية",
      subtitle: "نصف يوم تصوير",
      price: "5,000 جنيه",
      priceAmount: 5000,
      currency: "EGP",
      features: ["نصف يوم", "جميع الصور المعدلة", "ألبوم فاخر", "فيديو Highlight"],
      isHighlighted: true
    },
    {
      id: "gold",
      name: "الباقة الذهبية",
      subtitle: "تغطية يوم كامل",
      price: "8,500 جنيه",
      priceAmount: 8500,
      currency: "EGP",
      features: ["يوم كامل", "تصوير العريس والعروسة", "فيديو سينمائي", "ألبوم فاخر", "معرض إلكتروني", "تسليم سريع"],
      isHighlighted: false
    }
  ],
  extras: [
    { id: "cinematic", name: "فيديو سينمائي", price: "3,000 جنيه", priceAmount: 3000, currency: "EGP", iconKey: "video" },
    { id: "drone", name: "Drone", price: "2,500 جنيه", priceAmount: 2500, currency: "EGP", iconKey: "camera" },
    { id: "pre-wedding", name: "جلسة قبل الزفاف", price: "2,000 جنيه", priceAmount: 2000, currency: "EGP", iconKey: "camera" },
    { id: "album", name: "ألبوم فاخر", price: "1,500 جنيه", priceAmount: 1500, currency: "EGP", iconKey: "album" },
    { id: "printing", name: "طباعة إضافية", price: "حسب الطلب", priceAmount: 0, currency: "EGP", iconKey: "album" }
  ],
  gallery: DEMO_GALLERY,
  structuredData: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Kareem Magdy"
  }
};

export function getPlatformSeedData() {
  return {
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
    templates: templateDefinitions.map((template) => ({
      code: template.code,
      themeCode: template.themeCode,
      name: template.name,
      status: template.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      showroomOrder: template.showroomOrder,
      previewData: DEMO_PREVIEW_DATA,
      settings: {}
    })),
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
            accountName: "FrameID",
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
            accountName: "FrameID",
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
    backupSettings: [
      {
        type: "DATABASE" as const,
        enabled: true,
        schedule: "0 2 * * *",
        retentionCount: 14,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      },
      {
        type: "UPLOADS" as const,
        enabled: true,
        schedule: "0 3 * * *",
        retentionCount: 14,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      },
      {
        type: "FULL" as const,
        enabled: true,
        schedule: "0 4 * * 0",
        retentionCount: 8,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      }
    ]
  };
}
