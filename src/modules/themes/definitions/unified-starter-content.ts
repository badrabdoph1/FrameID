import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";
import { OFFICIAL_TEMPLATE_STARTER_DEFAULTS as defaults } from "@/modules/themes/template-starter-defaults";

/**
 * المصدر الموحد لمحتوى بداية القوالب
 * جميع القوالب تستخدم نفس البيانات لضمان التوحيد
 */
export const unifiedTemplateStarterContent = parseTemplateStarterContent({
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
      cta: { label: "شاهد الباقات", target: "packages" },
      settings: { eyebrow: "Portraits · Stories · Light" }
    },
    gallery: {
      title: "لمحات من الأعمال",
      sortOrder: 1,
      isVisible: true,
      description: "مختارات من جلسات الزفاف والخطوبة بتفاصيل قريبة وإضاءة طبيعية.",
      settings: { eyebrow: "أعمال مختارة", layout: "snap", limit: 6 }
    },
    packages: {
      title: "اختر باقتك",
      sortOrder: 2,
      isVisible: true,
      description: "اختار التغطية الأنسب ليومك، ويمكنك إضافة أي خدمة تحتاجها قبل تأكيد الحجز.",
      settings: { eyebrow: "باقات التصوير", layout: "snap" }
    },
    extras: {
      title: "إضافات مميزة",
      sortOrder: 3,
      isVisible: true,
      description: "أضف خدمة تصوير أو ألبوم أو فيديو حسب احتياج اليوم.",
      settings: { eyebrow: "خدمات إضافية", layout: "compact" }
    },
    contact: {
      title: "التواصل",
      sortOrder: 4,
      isVisible: true,
      callToAction: "احجز موعدك الآن",
      settings: { eyebrow: "تواصل مباشر", layout: "grid" }
    }
  },
  contact: {
    studioName: defaults.studioName,
    bio: defaults.description,
    longDescription: defaults.description,
    phone: "+201000000001",
    whatsapp: "+201000000001",
    email: "hello@kareemmagdy.example",
    instagram: "kareemmagdy.photo",
    facebook: "kareemmagdy.photo",
    tiktok: "@kareemmagdy.photo",
    workLocation: "فريلانسر"
  },
  packages: [
    {
      id: "pkg-basic",
      name: "Session Basic",
      subtitle: "كل اللي تحتاجه لبداية مميزة",
      priceAmount: 2500,
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
      id: "pkg-full",
      name: "Full Day",
      subtitle: "الباقة الأكثر طلبًا بين العرسان",
      priceAmount: 5000,
      currency: "EGP",
      features: [
        "فوتوسيشن خارجي (Outdoor)",
        "شامل رسوم اللوكيشن",
        "ألبوم قطيفة فاخر مقاس 30 × 40",
        "تصوير Reels احترافي"
      ],
      imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=85",
      isHighlighted: true,
      sortOrder: 1
    },
    {
      id: "pkg-vip",
      name: "VIP",
      subtitle: "التجربة الكاملة بدون أي تنازلات",
      priceAmount: 8500,
      currency: "EGP",
      features: [
        "فوتوسيشن خارجي (Outdoor)",
        "شامل رسوم اللوكيشن",
        "ألبوم قطيفة فاخر مقاس 30 × 40",
        "تابلوه حائط فاخر مقاس 50 × 70",
        "تصوير Reels سينمائي لتوثيق أجمل اللحظات"
      ],
      imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=900&q=85",
      isHighlighted: false,
      sortOrder: 2
    }
  ],
  extras: [
    {
      id: "extra-cinematic",
      name: "فيديو سينمائي",
      description: "فيلم قصير يلخص أجمل لحظات اليوم.",
      priceAmount: 3000,
      currency: "EGP",
      iconKey: "video",
      sortOrder: 0
    },
    {
      id: "extra-drone",
      name: "تصوير جوي",
      description: "لقطات جوية للمكان والاحتفال.",
      priceAmount: 2500,
      currency: "EGP",
      iconKey: "camera",
      sortOrder: 1
    },
    {
      id: "extra-album",
      name: "ألبوم فاخر",
      description: "ألبوم مطبوع بتغليف فاخر.",
      priceAmount: 1500,
      currency: "EGP",
      iconKey: "album",
      sortOrder: 2
    }
  ],
  gallery: {
    album: {
      title: "مختارات من أعمالنا",
      description: "لحظات عاطفية وتفاصيل أنيقة من حفلات حقيقية.",
      sortOrder: 0
    },
    images: [
      {
        id: "gallery-1",
        url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
        alt: "عروسان في حفل خارجي",
        caption: "لحظة تبادل الخواتم",
        sortOrder: 0,
        isFeatured: true
      },
      {
        id: "gallery-2",
        url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85",
        alt: "تفاصيل باقة ورد",
        caption: "تفاصيل لا تتكرر",
        sortOrder: 1,
        isFeatured: false
      },
      {
        id: "gallery-3",
        url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85",
        alt: "ديكور حفل زفاف",
        caption: "إضاءة المساء",
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
  themeSettings: {}
});
