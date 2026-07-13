import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";
import { OFFICIAL_TEMPLATE_STARTER_DEFAULTS as defaults } from "@/modules/themes/template-starter-defaults";

export const roseBlushTheme: ThemeDefinition = {
  code: "rose-blush",
  name: "أنيق وهادئ",
  version: "1.0.0",
  status: "published",
  supportedSections: ["hero", "gallery", "packages", "extras", "contact"],
  defaultConfig: { colorPreset: "rose", layoutDensity: "spacious", motion: "gentle" }
};

export const roseBlushTemplate: TemplateSummary = {
  code: "rose-blush",
  themeCode: "rose-blush",
  name: "أنيق وهادئ",
  status: "published",
  showroomOrder: 2,
  description: "قالب فاتح أنيق بألوان الورد والمريمية، مثالي للمصورين الذين يفضلون التصميم الناعم العصري.",
  starterContent: parseTemplateStarterContent({
    site: { title: defaults.photographerName, description: defaults.description },
    sections: {
      hero: { title: "الرئيسية", sortOrder: 0, isVisible: true, headline: defaults.photographerName, subheadline: defaults.description, imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=85" },
      gallery: { title: "لحظات لا تُنسى", sortOrder: 1, isVisible: true, description: "كل صورة تحكي قصة، وكل قصة تستحق أن تُروى بجمال." },
      packages: { title: "اختاري باقتك المثالية", sortOrder: 2, isVisible: true, description: "باقات مرنة تناسب كل مناسبة، مع لمسات احترافية لا تُنسى." },
      extras: { title: "لمسة إضافية", sortOrder: 3, isVisible: true, description: "اجعل تجربتك أكثر تميزًا مع هذه الإضافات." },
      contact: { title: "التواصل", sortOrder: 4, isVisible: true, callToAction: "لنخطط لجلسة جميلة" }
    },
    contact: { studioName: defaults.studioName, bio: defaults.description, longDescription: defaults.description, phone: "+201000000002", whatsapp: "+201000000002", email: "hello@noorali.example", instagram: "noorali.photo", facebook: "noorali.photo" },
    packages: [
      { id: "rose-basic", name: "Session Basic", subtitle: "كل اللي تحتاجه لبداية مميزة", priceAmount: 0, currency: "EGP", features: ["فوتوسيشن خارجي (Outdoor)", "شامل رسوم اللوكيشن", "تعديل احترافي للصور", "تصوير Reels قصير للسوشيال ميديا"], imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 0 },
      { id: "rose-full", name: "Full Day", subtitle: "الباقة الأكثر طلبًا بين العرسان", priceAmount: 0, currency: "EGP", features: ["فوتوسيشن خارجي (Outdoor)", "شامل رسوم اللوكيشن", "ألبوم قطيفة فاخر مقاس 30 × 40", "تصوير Reels احترافي"], imageUrl: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=85", isHighlighted: true, sortOrder: 1 },
      { id: "rose-vip", name: "VIP", subtitle: "التجربة الكاملة بدون أي تنازلات", priceAmount: 0, currency: "EGP", features: ["فوتوسيشن خارجي (Outdoor)", "شامل رسوم اللوكيشن", "ألبوم قطيفة فاخر مقاس 30 × 40", "تابلوه حائط فاخر مقاس 50 × 70", "تصوير Reels سينمائي لتوثيق أجمل اللحظات"], imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 2 }
    ],
    extras: [
      { id: "rose-film", name: "فيلم قصير", description: "فيديو ناعم يلخص أجمل اللحظات.", priceAmount: 2800, currency: "EGP", iconKey: "video", sortOrder: 0 },
      { id: "rose-before", name: "جلسة قبل المناسبة", description: "جلسة تصوير خارجية قبل يوم المناسبة.", priceAmount: 1800, currency: "EGP", iconKey: "camera", sortOrder: 1 },
      { id: "rose-prints", name: "مجموعة مطبوعات", description: "مجموعة صور مطبوعة بتغليف أنيق.", priceAmount: 900, currency: "EGP", iconKey: "album", sortOrder: 2 }
    ],
    gallery: {
      album: { title: "قصص نحبها", description: "مشاهد دافئة من احتفالات وعائلات جميلة.", sortOrder: 0 },
      images: [
        { id: "rose-gallery-1", url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85", alt: "عروسان يبتسمان", caption: "بداية الحكاية", sortOrder: 0, isFeatured: true },
        { id: "rose-gallery-2", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85", alt: "تفاصيل حفل ناعم", caption: "ألوان هادئة", sortOrder: 1, isFeatured: false },
        { id: "rose-gallery-3", url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85", alt: "احتفال عائلي", caption: "فرح بسيط", sortOrder: 2, isFeatured: false }
      ]
    },
    seo: { title: defaults.photographerName, description: defaults.description, canonicalUrl: null, robotsIndex: true, structuredData: { "@context": "https://schema.org", "@type": "ProfessionalService", name: defaults.photographerName, description: defaults.description } },
    themeSettings: { colorPreset: "rose", layoutDensity: "spacious", motion: "gentle" }
  })
};
