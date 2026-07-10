import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { parseTemplateStarterContent } from "@/modules/themes/template-starter-content";

export const roseBlushTheme: ThemeDefinition = {
  code: "rose-blush",
  name: "أنيق وهادئ",
  version: "1.0.0",
  status: "published",
  supportedSections: ["hero", "gallery", "packages", "extras", "contact"],
  defaultConfig: {
    colorPreset: "rose",
    layoutDensity: "spacious",
    motion: "gentle"
  }
};

export const roseBlushTemplate: TemplateSummary = {
  code: "rose-blush",
  themeCode: "rose-blush",
  name: "أنيق وهادئ",
  status: "published",
  showroomOrder: 2,
  description: "قالب فاتح أنيق بألوان الورد والمريمية، مثالي للمصورين الذين يفضلون التصميم الناعم العصري.",
  starterContent: parseTemplateStarterContent({
    site: { title: "استوديو نور علي", description: "تصوير ناعم وعصري للاحتفالات والقصص العائلية الصغيرة." },
    sections: {
      hero: { title: "الرئيسية", sortOrder: 0, isVisible: true, headline: "استوديو نور علي", subheadline: "نلتقط الحب والبهجة بصور خفيفة وحقيقية تناسب أجمل أيامكم.", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=85" },
      contact: { title: "التواصل", sortOrder: 10, isVisible: true, callToAction: "لنخطط لجلسة جميلة" }
    },
    contact: { studioName: "استوديو نور علي", bio: "مصورات نحب الضوء الطبيعي والتفاصيل الرقيقة.", longDescription: "نصمم تجربة تصوير مريحة من أول مكالمة حتى تسليم معرضكم، لنترك لكم مساحة للعيش في اللحظة.", phone: "+201000000002", whatsapp: "+201000000002", email: "hello@noorali.example", instagram: "noorali.photo", facebook: "noorali.photo" },
    packages: [
      { id: "rose-mini", name: "جلسة الورد", subtitle: "جلسة قصيرة ومبهجة", priceAmount: 2200, currency: "EGP", features: ["ساعتان", "50 صورة معدلة", "معرض خاص"], imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 0 },
      { id: "rose-story", name: "باقة الحكاية", subtitle: "تغطية نصف يوم", priceAmount: 4800, currency: "EGP", features: ["نصف يوم", "150 صورة معدلة", "فيلم مختصر"], imageUrl: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=85", isHighlighted: true, sortOrder: 1 },
      { id: "rose-celebration", name: "باقة الاحتفال", subtitle: "تغطية يوم كامل", priceAmount: 7800, currency: "EGP", features: ["يوم كامل", "ألبوم مطبوع", "فيديو Highlights"], imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85", isHighlighted: false, sortOrder: 2 }
    ],
    extras: [
      { id: "rose-film", name: "فيلم قصير", priceAmount: 2800, currency: "EGP", iconKey: "video", sortOrder: 0 },
      { id: "rose-before", name: "جلسة قبل المناسبة", priceAmount: 1800, currency: "EGP", iconKey: "camera", sortOrder: 1 },
      { id: "rose-prints", name: "مجموعة مطبوعات", priceAmount: 900, currency: "EGP", iconKey: "album", sortOrder: 2 }
    ],
    gallery: {
      album: { title: "قصص نحبها", description: "مشاهد دافئة من احتفالات وعائلات جميلة.", sortOrder: 0 },
      images: [
        { id: "rose-gallery-1", url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85", alt: "عروسان يبتسمان", caption: "بداية الحكاية", sortOrder: 0 },
        { id: "rose-gallery-2", url: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=85", alt: "تفاصيل حفل ناعم", caption: "ألوان هادئة", sortOrder: 1 },
        { id: "rose-gallery-3", url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85", alt: "احتفال عائلي", caption: "فرح بسيط", sortOrder: 2 }
      ]
    },
    seo: { title: "استوديو نور علي", description: "تصوير احتفالات وقصص عائلية بأسلوب ناعم وعصري.", canonicalUrl: null, robotsIndex: true, structuredData: { "@context": "https://schema.org", "@type": "ProfessionalService", name: "استوديو نور علي", description: "تصوير احتفالات وقصص عائلية بأسلوب ناعم وعصري." } },
    themeSettings: { colorPreset: "rose", layoutDensity: "spacious", motion: "gentle" }
  })
};
