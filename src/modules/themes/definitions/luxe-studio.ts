import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";
import { OFFICIAL_TEMPLATE_STARTER_DEFAULTS as defaults } from "@/modules/themes/template-starter-defaults";
import { PLATFORM_TEMPLATE_SECTION_TYPES } from "@/modules/themes/template-contract";

export const luxeStudioTheme: ThemeDefinition = {
  code: "luxe-studio",
  name: "استوديو فاخر",
  version: "1.0.0",
  status: "published",
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: { colorPreset: "charcoal", layoutDensity: "editorial", motion: "refined" }
};

export const luxeStudioTemplate: TemplateSummary = {
  code: "luxe-studio",
  themeCode: "luxe-studio",
  name: "استوديو فاخر",
  status: "published",
  showroomOrder: 3,
  description: "قالب عصري فاخر بخلفية داكنة ولمسات نيون أنيقة، مثالي للمصورين الذين يريدون موقعًا سينمائيًا مع تجربة حجز سلسة.",
  starterContent: parseTemplateStarterContent({
    site: { title: defaults.photographerName, description: defaults.description },
    sections: {
      hero: {
        title: "الرئيسية",
        sortOrder: 0,
        isVisible: true,
        headline: defaults.photographerName,
        subheadline: defaults.description,
        imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
        overlay: "medium",
        position: "center",
        height: "screen",
        cta: { label: "استكشف الباقات", target: "packages" },
        settings: { eyebrow: "Luxury · Elegance · Timeless" }
      },
      gallery: {
        title: "معرض الأعمال",
        sortOrder: 1,
        isVisible: true,
        description: "لحظات خالدة مصممة بعناية فائقة وإضاءة احترافية.",
        settings: { eyebrow: "Portfolio Highlights", layout: "snap", limit: 6 }
      },
      packages: {
        title: "باقات التصوير",
        sortOrder: 2,
        isVisible: true,
        description: "اختيار شامل من الباقات المصممة لتلبية كل احتياجاتك.",
        settings: { eyebrow: "Premium Packages", layout: "snap" }
      },
      extras: {
        title: "خدمات إضافية",
        sortOrder: 3,
        isVisible: true,
        description: "أضف لمسات احترافية لجعل تجربتك أكثر تميزًا.",
        settings: { eyebrow: "Add-On Services", layout: "cards" }
      },
      contact: {
        title: "التواصل",
        sortOrder: 4,
        isVisible: true,
        callToAction: "احجز جلستك الآن",
        settings: { eyebrow: "Get In Touch", layout: "grid" }
      }
    },
    contact: {
      studioName: defaults.studioName,
      bio: defaults.description,
      longDescription: defaults.description,
      phone: "+201000000003",
      whatsapp: "+201000000003",
      email: "hello@luxestudio.example",
      instagram: "luxe.studio",
      facebook: "luxe.studio",
      tiktok: "@luxestudio",
      workLocation: "فريلانسر"
    },
    packages: [
      {
        id: "luxe-basic",
        name: "Basic Session",
        subtitle: "بداية مثالية لجلسة تصوير احترافية",
        priceAmount: 3000,
        currency: "EGP",
        features: [
          "فوتوسيشن خارجي (Outdoor)",
          "شامل رسوم اللوكيشن",
          "تعديل احترافي للصور",
          "تصوير Reels قصير للسوشيال ميديا"
        ],
        imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85",
        isHighlighted: false,
        sortOrder: 0
      },
      {
        id: "luxe-premium",
        name: "Premium Experience",
        subtitle: "الباقة الأكثر طلبًا للتجربة الكاملة",
        priceAmount: 6000,
        currency: "EGP",
        features: [
          "فوتوسيشن خارجي (Outdoor)",
          "شامل رسوم اللوكيشن",
          "ألبوم قطيفة فاخر مقاس 30 × 40",
          "تصوير Reels احترافي",
          "جلسة إضافية داخلية"
        ],
        imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=85",
        isHighlighted: true,
        sortOrder: 1
      },
      {
        id: "luxe-ultimate",
        name: "Ultimate Collection",
        subtitle: "التجربة الفاخرة بدون حدود",
        priceAmount: 9500,
        currency: "EGP",
        features: [
          "فوتوسيشن خارجي (Outdoor)",
          "شامل رسوم اللوكيشن",
          "ألبوم قطيفة فاخر مقاس 30 × 40",
          "تابلوه حائط فاخر مقاس 50 × 70",
          "تصوير Reels سينمائي",
          "جلسة إضافية داخلية",
          "تصوير جوي بالدرور"
        ],
        imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=900&q=85",
        isHighlighted: false,
        sortOrder: 2
      }
    ],
    extras: [
      {
        id: "luxe-cinematic",
        name: "فيديو سينمائي",
        description: "فيلم قصير يحكي قصة يومك بأسلوب سينمائي.",
        priceAmount: 3500,
        currency: "EGP",
        iconKey: "video",
        sortOrder: 0
      },
      {
        id: "luxe-drone",
        name: "تصوير جوي بالدرور",
        description: "لقطات جوية مذهلة للمكان والاحتفال.",
        priceAmount: 2800,
        currency: "EGP",
        iconKey: "camera",
        sortOrder: 1
      },
      {
        id: "luxe-album",
        name: "ألبوم فاخر",
        description: "ألبوم مطبوع بتغليف فاخر وجودة عالية.",
        priceAmount: 1800,
        currency: "EGP",
        iconKey: "album",
        sortOrder: 2
      },
      {
        id: "luxe-print",
        name: "مطبوعات فنية",
        description: "مجموعة مطبوعات فنية بتوقيع المصور.",
        priceAmount: 1200,
        currency: "EGP",
        iconKey: "album",
        sortOrder: 3
      }
    ],
    gallery: {
      album: {
        title: "أعمال مختارة",
        description: "لحظات خالدة من حفلات وجلسات تصوير احترافية.",
        sortOrder: 0
      },
      images: [
        {
          id: "luxe-gallery-1",
          url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
          alt: "عروسان في حفل فاخر",
          caption: "لحظة ساحرة",
          sortOrder: 0,
          isFeatured: true
        },
        {
          id: "luxe-gallery-2",
          url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85",
          alt: "تفاصيل حفل أنيقة",
          caption: "تفاصيل لا تُنسى",
          sortOrder: 1,
          isFeatured: false
        },
        {
          id: "luxe-gallery-3",
          url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85",
          alt: "إضاءة احترافية",
          caption: "فن الإضاءة",
          sortOrder: 2,
          isFeatured: false
        }
      ]
    },
    seo: {
      title: defaults.photographerName,
      description: defaults.description,
      canonicalUrl: null,
      robotsIndex: true,
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: defaults.photographerName,
        description: defaults.description
      }
    },
    themeSettings: {
      colorPreset: "charcoal",
      layoutDensity: "editorial",
      motion: "refined"
    }
  })
};
