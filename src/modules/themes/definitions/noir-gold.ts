import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";

export const noirGoldTheme: ThemeDefinition = {
  code: "noir-gold",
  name: "كلاسك",
  version: "1.0.0",
  status: "published",
  supportedSections: ["hero", "gallery", "packages", "extras", "contact"],
  defaultConfig: {
    colorPreset: "champagne",
    layoutDensity: "editorial",
    motion: "quiet"
  }
};

export const noirGoldTemplate: TemplateSummary = {
  code: "noir-gold",
  themeCode: "noir-gold",
  name: "كلاسك",
  status: "published",
  showroomOrder: 1,
  description: "قالب كلاسيكي داكن بلمسة ذهبية، مناسب للمصورين الذين يريدون موقعًا فاخرًا وواضحًا للباقات والحجز.",
  starterContent: parseTemplateStarterContent({
    site: {
      title: "استوديو كريم مجدي",
      description: "تصوير زفاف وخطوبة بأسلوب سينمائي هادئ يلتقط التفاصيل الصادقة."
    },
    sections: {
      hero: {
        title: "الرئيسية",
        sortOrder: 0,
        isVisible: true,
        headline: "استوديو كريم مجدي",
        subheadline: "نصنع ذكريات تبقى للأبد بتصوير زفاف وخطوبة يوازن بين الفخامة واللحظة الحقيقية.",
        imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85"
      },
      contact: {
        title: "التواصل",
        sortOrder: 10,
        isVisible: true,
        callToAction: "احجز موعدك الآن"
      }
    },
    contact: {
      studioName: "استوديو كريم مجدي",
      bio: "مصور زفاف وخطوبة يوثق التفاصيل الهادئة واللحظات الكبيرة.",
      longDescription: "نبدأ من قصتك ونصنع صورًا دافئة ومتوازنة تظل قريبة منكم حتى بعد مرور السنوات.",
      phone: "+201000000001",
      whatsapp: "+201000000001",
      email: "hello@kareemmagdy.example",
      instagram: "kareemmagdy.photo",
      facebook: "kareemmagdy.photo"
    },
    packages: [
      { id: "noir-bronze", name: "الباقة البرونزية", subtitle: "جلسة تصوير بسيطة", priceAmount: 2500, currency: "EGP", features: ["3 ساعات", "جميع الصور المعدلة", "معرض إلكتروني"], imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 0 },
      { id: "noir-silver", name: "الباقة الفضية", subtitle: "نصف يوم تصوير", priceAmount: 5000, currency: "EGP", features: ["نصف يوم", "ألبوم فاخر", "فيديو مختصر"], imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=85", isHighlighted: true, sortOrder: 1 },
      { id: "noir-gold", name: "الباقة الذهبية", subtitle: "تغطية يوم كامل", priceAmount: 8500, currency: "EGP", features: ["يوم كامل", "فيديو سينمائي", "تسليم سريع"], imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 2 }
    ],
    extras: [
      { id: "noir-cinematic", name: "فيديو سينمائي", priceAmount: 3000, currency: "EGP", iconKey: "video", sortOrder: 0 },
      { id: "noir-drone", name: "تصوير جوي", priceAmount: 2500, currency: "EGP", iconKey: "camera", sortOrder: 1 },
      { id: "noir-album", name: "ألبوم فاخر", priceAmount: 1500, currency: "EGP", iconKey: "album", sortOrder: 2 }
    ],
    gallery: {
      album: { title: "مختارات من أعمالنا", description: "لحظات عاطفية وتفاصيل أنيقة من حفلات حقيقية.", sortOrder: 0 },
      images: [
        { id: "noir-gallery-1", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85", alt: "عروسان في حفل خارجي", caption: "لحظة تبادل الخواتم", sortOrder: 0 },
        { id: "noir-gallery-2", url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=85", alt: "تفاصيل باقة ورد", caption: "تفاصيل لا تتكرر", sortOrder: 1 },
        { id: "noir-gallery-3", url: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85", alt: "ديكور حفل زفاف", caption: "إضاءة المساء", sortOrder: 2 }
      ]
    },
    seo: { title: "استوديو كريم مجدي", description: "تصوير زفاف وخطوبة بأسلوب سينمائي هادئ.", canonicalUrl: null, robotsIndex: true, structuredData: { "@context": "https://schema.org", "@type": "ProfessionalService", name: "استوديو كريم مجدي", description: "تصوير زفاف وخطوبة بأسلوب سينمائي هادئ." } },
    themeSettings: { colorPreset: "champagne", layoutDensity: "editorial", motion: "quiet" }
  })
};
