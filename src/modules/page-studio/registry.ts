import { z } from "zod";
import {
  HomepageDataSchema,
  TemplatesPageSchema,
  PricingPageSchema,
  AuthPageSchema,
  CheckoutPageSchema,
  ResultPageSchema,
} from "@/lib/content/schemas/marketing";
import type { PageDefinition, PageSectionDefinition, EditableFieldConfig } from "./types";

function createField(
  path: string,
  label: string,
  type: EditableFieldConfig["type"],
  options?: Partial<EditableFieldConfig>
): EditableFieldConfig {
  return { path, label, type, ...options };
}

export const HOMEPAGE_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "العنوان الرئيسي، الشعار، الصورة، وأزرار الإجراء",
    contentPath: "hero",
    defaultData: {
      badge: "منصة مواقع للمصورين",
      headline: "كل صفحاتك وأسعارك وتفاصيلك…",
      headlineHighlight: "في رابط واحد",
      subheadline: "ابعت أسعارك وباقاتك بشكل احترافي بدل ملفات PDF والصور، وخلي عميلك يوصل لكل حاجة عنك من رابط واحد.",
      heroImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85",
      cta: { label: "ابدأ مجانًا", href: "/templates" },
      secondaryCta: { label: "شاهد مثال لموقع مصور", href: "/templates" },
      trustPoints: [
        { text: "تجربة مجانية" },
        { text: "لينك واحد" },
        { text: "موقع كامل" },
        { text: "أسعارك وباقاتك" },
        { text: "كل صفحاتك" },
        { text: "معرض لصورك" },
        { text: "العميل يحجز من خلاله" }
      ]
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("headlineHighlight", "الجزء المبرز من العنوان", "text"),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
        createField("cta.label", "نص الزر الرئيسي", "text", { required: true }),
        createField("cta.href", "رابط الزر الرئيسي", "url", { required: true }),
        createField("secondaryCta.label", "نص الزر الثانوي", "text"),
        createField("secondaryCta.href", "رابط الزر الثانوي", "url"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "benefits",
    title: "المميزات (Benefits)",
    description: "بطاقات المميزات التسع",
    contentPath: "benefits",
    defaultData: {
      items: [
        { title: "أسعارك واضحة", body: "بدل ما ترد كل مرة، العميل يشوف الباقات والأسعار بنفسه." },
        { title: "شغلك مترتب", body: "اعرض صورك في ألبومات منظمة تخلي العميل يشوف مستواك بسرعة." },
        { title: "لينك واحد يكفي", body: "ابعت رابط واحد فيه شغلك، أسعارك، بياناتك، وكل صفحاتك." },
        { title: "تعديل من غير انتظار", body: "غيّر الصور والأسعار والباقات بنفسك في أي وقت." },
        { title: "تواصل وحجز أسرع", body: "العميل يوصلك من واتساب أو يحجز من غير لف ودوران." },
        { title: "شكلك أشيك", body: "بدل صور متفرقة وملفات PDF، قدم نفسك بشكل يليق بشغلك." },
        { title: "كل حساباتك في مكان", body: "فيسبوك، إنستجرام، تيك توك، واتساب، وكل روابطك في صفحة واحدة." },
        { title: "أسئلة أقل", body: "لما كل التفاصيل واضحة، وقتك يروح للعميل الجاد مش للشرح المتكرر." },
        { title: "يفتح من أي جهاز", body: "الموقع شكله مضبوط على الموبايل والتابلت والكمبيوتر." },
        { title: "مشاركة أسهل", body: "حط الرابط في البايو، ابعته في الشات، أو ضيفه على كارتك." },
      ],
    },
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("body", "الوصف", "textarea", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "howItWorks",
    title: "كيف يعمل (How It Works)",
    description: "خطوات البدء الأربع",
    contentPath: "howItWorks",
    defaultData: {
      items: [
        { step: 1, title: "اختار تصميم على ذوقك", body: "الاختيارات كتير. اختار براحتك الشكل اللي يليق بشغلك.", href: "/templates" },
        { step: 2, title: "أنشئ حسابك مجانًا", body: "هيكون ليك لوحة تحكم تغيّر منها كل حاجة في موقعك.", href: "/signup" },
        { step: 3, title: "ادخل لوحة التحكم", body: "هتلاقي رابط موقعك وكل الخطوات واضحة وسلسة.", href: "/dashboard" },
        { step: 4, title: "ارجع عدّل في أي وقت", body: "سجّل دخولك تاني وغيّر الصور والأسعار براحتك.", href: "/login" },
      ],
    },
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("body", "الوصف", "textarea", { required: true }),
        createField("href", "الرابط", "url"),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "templateSection",
    title: "قسم القوالب (Template Section)",
    description: "عنوان ووصف قسم عرض القوالب",
    contentPath: "templateSection",
    defaultData: {
      badge: "شوف بنفسك",
      title: "كده يبقى شكل موقعك",
      subtitle: "ده تصميم واحد من ضمن تصميمات مختلفة كتير عشان تبقى مختلف."
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("title", "العنوان", "text", { required: true }),
        createField("subtitle", "الوصف", "textarea", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "trustSection",
    title: "قسم الثقة والأسئلة (Trust & FAQ)",
    description: "الأسئلة الشائعة لبناء الثقة",
    contentPath: "trustSection",
    defaultData: {
      badge: "الأسئلة السريعة",
      title: "عندك سؤال؟ إحنا جاوبناه",
      message: ""
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("title", "العنوان", "text", { required: true }),
        createField("message", "الرسالة", "textarea"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "faq",
    title: "الأسئلة الشائعة (FAQ)",
    description: "قائمة الأسئلة والأجوبة",
    contentPath: "faq.items",
    defaultData: {
      items: [
        { question: "هل أحتاج بطاقة ائتمان للتجربة؟", answer: "لا أبداً. ١٤ يوم مجاناً بدون إضافة أي بيانات دفع. جرب وقرر بعدين." },
        { question: "وين راح يظهر موقعي؟", answer: "رابط خاص: frameid.app/p/اسمك. تقدر تشاركه في واتساب، إنستغرام، أو بطاقة عملك." },
        { question: "وش يصير بعد التجربة؟", answer: "موقعك يبقى موجود ومحتواك محفوظ. تقدر تفعل الاشتراك بأي خطة تناسبك." },
        { question: "هل ينفع موقعي لجوالات العملاء؟", answer: "كل القوالب مصممة للجوال والكمبيوتر—العميل يفتح الرابط ويشوف كل شيء بسرعة." },
        { question: "كم التكلفة بعد التجربة؟", answer: "الخطط تبدأ من ٢٩ ريال شهرياً. تقدر تلغي أي وقت. وما نخزّن بيانات بطاقتك إلا لما تقرر الاشتراك." },
      ],
    },
    editorConfig: {
      editableFields: [
        createField("question", "السؤال", "text", { required: true }),
        createField("answer", "الإجابة", "textarea", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "finalCta",
    title: "دعوة الإجراء النهائية (Final CTA)",
    description: "القسم الأخير لتحفيز التسجيل",
    contentPath: "finalCta",
    defaultData: {
      title: "خلّي شغلك كله في رابط واحد",
      subtext: "ابدأ مجانًا وخلي عميلك يشوف صورك وباقاتك ويتواصل معاك بسهولة.",
      cta: { label: "ابدأ مجانًا", href: "/templates" }
    },
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("subtext", "النص الفرعي", "textarea", { required: true }),
        createField("cta.label", "نص الزر", "text", { required: true }),
        createField("cta.href", "رابط الزر", "url", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "mobileStickyCta",
    title: "شريط الإجراء الثابت (Mobile Sticky CTA)",
    description: "الشريط الثابت في أسفل الشاشة على الموبايل",
    contentPath: "mobileStickyCta",
    defaultData: {
      label: "موقعك في رابط واحد",
      buttonText: "ابدأ مجانًا",
      href: "/templates"
    },
    editorConfig: {
      editableFields: [
        createField("label", "العنوان", "text", { required: true }),
        createField("buttonText", "نص الزر", "text", { required: true }),
        createField("href", "الرابط", "url", { required: true }),
      ],
      sortable: false,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "photographerTypes",
    title: "أنواع المصورين (Photographer Types)",
    description: "قائمة أنواع المصورين المستهدفة",
    contentPath: "photographerTypes",
    defaultData: {
      items: [
        { label: "مصورين زفاف" },
        { label: "مصورين خطوبة" },
        { label: "مصورين أطفال" },
        { label: "مصورين تخرج" },
        { label: "مصورين مناسبات" },
        { label: "استوديوهات تصوير" },
      ],
    },
    editorConfig: {
      editableFields: [
        createField("label", "النوع", "text", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
];

export const TEMPLATES_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "العنوان، الوصف، والصورة الرئيسية",
    contentPath: "hero",
    defaultData: {
      badge: "استكشف القوالب",
      headline: "اختر التصميم الذي يناسب أسلوبك",
      subheadline: "مجموعة متنوعة من القوالب المصممة خصيصاً للمصورين. كل قالب قابل للتخصيص بالكامل.",
      heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
      cta: { label: "شاهد جميع القوالب", href: "#templates" },
      secondaryCta: { label: "ابدأ مجاناً", href: "/signup" }
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
        createField("cta.label", "نص الزر الرئيسي", "text", { required: true }),
        createField("cta.href", "رابط الزر الرئيسي", "url", { required: true }),
        createField("secondaryCta.label", "نص الزر الثانوي", "text"),
        createField("secondaryCta.href", "رابط الزر الثانوي", "url"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "filters",
    title: "مرشحات القوالب",
    description: "فئات تصفية القوالب",
    contentPath: "filters",
    defaultData: {
      title: "تصفية حسب النوع",
      categories: [
        { id: "all", label: "الكل", count: 12 },
        { id: "wedding", label: "زفاف", count: 5 },
        { id: "portrait", label: "بورتريه", count: 3 },
        { id: "event", label: "مناسبات", count: 2 },
        { id: "studio", label: "استوديو", count: 2 }
      ]
    },
    editorConfig: {
      editableFields: [
        createField("title", "عنوان المرشحات", "text", { required: true }),
        createField("categories", "الفئات", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "templatesGrid",
    title: "شبكة القوالب",
    description: "عرض بطاقات القوالب",
    contentPath: "templatesGrid",
    defaultData: {
      title: "قوالب متاحة",
      subtitle: "اضغط على أي قالب لمعاينة مباشرة",
      templates: [
        {
          id: "noir-gold",
          name: "كلاسك",
          category: "wedding",
          description: "قالب كلاسيكي داكن بلمسة ذهبية، مناسب للمصورين الذين يريدون موقعًا فاخرًا.",
          previewImage: "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg",
          tags: ["فاخر", "داكن", "ذهبي"]
        },
        {
          id: "rose-blush",
          name: "رومانسي",
          category: "wedding",
          description: "تصميم ناعم بألوان وردية دافئة، مثالي لصور الزفاف والخطوبة.",
          previewImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85",
          tags: ["رومانسي", "وردي", "ناعم"]
        },
        {
          id: "minimal-white",
          name: "بسيط",
          category: "portrait",
          description: "تصميم بسيط ونظيف يركز على صورك بدون تشتيت.",
          previewImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85",
          tags: ["بسيط", "أبيض", "نظيف"]
        }
      ]
    },
    editorConfig: {
      editableFields: [
        createField("title", "عنوان الشبكة", "text", { required: true }),
        createField("subtitle", "الوصف الفرعي", "textarea", { required: true }),
        createField("templates", "القوالب", "richtext"),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "finalCta",
    title: "دعوة الإجراء النهائية",
    description: "قسم التواصل للتخصيص",
    contentPath: "finalCta",
    defaultData: {
      title: "لم تجد ما تبحث عنه؟",
      subtext: "يمكنك تخصيص أي قالب ليناسب احتياجاتك تماماً، أو تواصل معنا لطلب قالب مخصص.",
      cta: { label: "تواصل معنا", href: "/contact" }
    },
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("subtext", "النص الفرعي", "textarea", { required: true }),
        createField("cta.label", "نص الزر", "text", { required: true }),
        createField("cta.href", "رابط الزر", "url", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
];

export const PRICING_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "عنوان صفحة الأسعار",
    contentPath: "hero",
    defaultData: {
      badge: "أسعار شفافة",
      headline: "اختر الخطة التي تناسبك",
      subheadline: "ابدأ مجاناً. لا بطاقة ائتمان مطلوبة. ترقية في أي وقت.",
      heroImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1800&q=85",
      cta: { label: "ابدأ مجاناً", href: "/signup" },
      secondaryCta: { label: "تواصل مع المبيعات", href: "/contact" }
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
        createField("cta.label", "نص الزر الرئيسي", "text", { required: true }),
        createField("cta.href", "رابط الزر الرئيسي", "url", { required: true }),
        createField("secondaryCta.label", "نص الزر الثانوي", "text"),
        createField("secondaryCta.href", "رابط الزر الثانوي", "url"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "plans",
    title: "الخطط والباقات",
    description: "بطاقات عرض الخطط",
    contentPath: "plans",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("name", "اسم الخطة", "text", { required: true }),
        createField("price", "السعر", "number", { required: true }),
        createField("currency", "العملة", "text", { required: true }),
        createField("period", "الدورة", "text", { required: true }),
        createField("description", "الوصف", "textarea", { required: true }),
        createField("features", "المميزات", "richtext"),
        createField("highlighted", "مميزة", "boolean"),
        createField("cta.label", "نص الزر", "text", { required: true }),
        createField("cta.href", "رابط الزر", "url", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "faq",
    title: "الأسئلة الشائعة للأسعار",
    description: "أسئلة وأجوبة عن الخطط",
    contentPath: "faq.items",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("question", "السؤال", "text", { required: true }),
        createField("answer", "الإجابة", "textarea", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "finalCta",
    title: "دعوة الإجراء النهائية",
    description: "زر البدء النهائي",
    contentPath: "finalCta",
    defaultData: {
      title: "مستعد للبدء؟",
      subtext: "انضم لآلاف المصورين الذين يثقون بـ FrameID",
      cta: { label: "أنشئ حسابك المجاني", href: "/signup" }
    },
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("subtext", "النص الفرعي", "textarea", { required: true }),
        createField("cta.label", "نص الزر", "text", { required: true }),
        createField("cta.href", "رابط الزر", "url", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
];

export const AUTH_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "العنوان، الوصف، والصورة/الرسم التوضيحي",
    contentPath: "hero",
    defaultData: {
      badge: "تسجيل الدخول",
      headline: "مرحباً بعودتك",
      subheadline: "سجل دخولك للوصول إلى لوحة التحكم وإدارة موقعك",
      heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
      illustration: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=85"
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
        createField("illustration", "الرسم التوضيحي", "image"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "form",
    title: "نموذج المصادقة",
    description: "حقول النموذج والأزرار",
    contentPath: "form",
    defaultData: {
      title: "تسجيل الدخول",
      subtitle: "أدخل بياناتك للوصول إلى حسابك",
      fields: [],
      submitButton: { label: "دخول", loadingLabel: "جاري الدخول..." },
      footerLinks: []
    },
    editorConfig: {
      editableFields: [
        createField("title", "عنوان النموذج", "text", { required: true }),
        createField("subtitle", "الوصف الفرعي", "textarea", { required: true }),
        createField("fields", "الحقول", "richtext"),
        createField("submitButton.label", "نص زر الإرسال", "text", { required: true }),
        createField("submitButton.loadingLabel", "نص التحميل", "text"),
        createField("footerLinks", "روابط التذييل", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "benefits",
    title: "مميزات المنصة",
    description: "بطاقات المميزات الجانبية",
    contentPath: "benefits",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("icon", "الأيقونة", "text"),
        createField("title", "العنوان", "text", { required: true }),
        createField("description", "الوصف", "textarea", { required: true }),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "helpSection",
    title: "قسم المساعدة",
    description: "روابط الدعم والمساعدة",
    contentPath: "helpSection",
    defaultData: {
      title: "تحتاج مساعدة؟",
      items: []
    },
    editorConfig: {
      editableFields: [
        createField("title", "عنوان القسم", "text", { required: true }),
        createField("items", "العناصر", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "footer",
    title: "تذييل الصفحة",
    description: "حقوق النشر والروابط القانونية",
    contentPath: "footer",
    defaultData: {
      copyright: "© 2024 FrameID. جميع الحقوق محفوظة.",
      links: []
    },
    editorConfig: {
      editableFields: [
        createField("copyright", "نص حقوق النشر", "text", { required: true }),
        createField("links", "الروابط", "richtext"),
      ],
      sortable: false,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
];

export const CHECKOUT_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "عنوان صفحة الدفع",
    contentPath: "hero",
    defaultData: {
      badge: "إتمام الدفع",
      headline: "أكمل اشتراكك",
      subheadline: "مراجعة طلبك واختر طريقة الدفع المفضلة",
      heroImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1800&q=85"
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "orderSummary",
    title: "ملخص الطلب",
    description: "تفاصيل الخطة والأسعار",
    contentPath: "orderSummary",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("plan.name", "اسم الخطة", "text", { required: true }),
        createField("plan.period", "الدورة", "text", { required: true }),
        createField("plan.price", "السعر", "number", { required: true }),
        createField("plan.currency", "العملة", "text", { required: true }),
        createField("items", "البنود", "richtext"),
        createField("total.label", "إجمالي", "text"),
        createField("total.amount", "المبلغ", "number", { required: true }),
        createField("total.currency", "العملة", "text", { required: true }),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "paymentMethods",
    title: "طرق الدفع",
    description: "خيارات الدفع المتاحة",
    contentPath: "paymentMethods",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("id", "المعرف", "text", { required: true }),
        createField("name", "الاسم", "text", { required: true }),
        createField("description", "الوصف", "textarea", { required: true }),
        createField("icon", "الأيقونة", "text"),
        createField("instructions", "التعليمات", "textarea"),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "form",
    title: "نموذج الدفع",
    description: "حقول إدخال بيانات الدفع",
    contentPath: "form",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("fields", "الحقول", "richtext"),
        createField("submitButton.label", "نص زر الدفع", "text", { required: true }),
        createField("submitButton.loadingLabel", "نص التحميل", "text"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "trustBadges",
    title: "شارات الثقة",
    description: "أيقونات الأمان والثقة",
    contentPath: "trustBadges",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("label", "النص", "text", { required: true }),
        createField("icon", "الأيقونة", "text"),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "footer",
    title: "تذييل الصفحة",
    description: "الروابط القانونية",
    contentPath: "footer",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("copyright", "نص حقوق النشر", "text", { required: true }),
        createField("links", "الروابط", "richtext"),
      ],
      sortable: false,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
];

export const RESULT_SECTIONS: PageSectionDefinition[] = [
  {
    id: "hero",
    title: "الشريحة الرئيسية (Hero)",
    description: "العنوان، الوصف، والأيقونة",
    contentPath: "hero",
    defaultData: {
      badge: "تم بنجاح",
      headline: "مرحباً بك في FrameID!",
      subheadline: "تم تفعيل اشتراكك بنجاح. موقعك جاهز الآن.",
      heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85",
      illustration: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=85"
    },
    editorConfig: {
      editableFields: [
        createField("badge", "الشارة", "text"),
        createField("headline", "العنوان الرئيسي", "text", { required: true }),
        createField("subheadline", "العنوان الفرعي", "textarea", { required: true }),
        createField("heroImage", "الصورة الرئيسية", "image", { required: true }),
        createField("illustration", "الرسم التوضيحي", "image"),
        createField("icon", "الأيقونة", "text"),
        createField("iconColor", "لون الأيقونة", "text"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "successCard",
    title: "بطاقة النجاح/الخطأ",
    description: "تفاصيل الاشتراك أو الخطأ",
    contentPath: "successCard",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("icon", "الأيقونة", "text"),
        createField("title", "العنوان", "text", { required: true }),
        createField("details", "التفاصيل", "richtext"),
        createField("possibleReasons", "الأسباب المحتملة", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "nextSteps",
    title: "الخطوات التالية / الإجراءات",
    description: "بطاقات الإجراءات المقترحة",
    contentPath: "nextSteps",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("steps", "الخطوات", "richtext"),
        createField("primary", "الإجراء الأساسي", "richtext"),
        createField("secondary", "الإجراءات الثانوية", "richtext"),
      ],
      sortable: true,
      duplicable: true,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "actions",
    title: "الإجراءات",
    description: "أزرار الإجراءات للصفحات الخطأ",
    contentPath: "actions",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("primary", "الإجراء الأساسي", "richtext"),
        createField("secondary", "الإجراءات الثانوية", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "help",
    title: "قسم المساعدة",
    description: "الأسئلة الشائعة وروابط الدعم",
    contentPath: "help",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("title", "العنوان", "text", { required: true }),
        createField("description", "الوصف", "textarea"),
        createField("cta.label", "نص زر الدعم", "text"),
        createField("cta.href", "رابط الدعم", "url"),
        createField("items", "العناصر", "richtext"),
      ],
      sortable: true,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
  {
    id: "footer",
    title: "تذييل الصفحة",
    description: "الروابط القانونية",
    contentPath: "footer",
    defaultData: {},
    editorConfig: {
      editableFields: [
        createField("copyright", "نص حقوق النشر", "text", { required: true }),
        createField("links", "الروابط", "richtext"),
      ],
      sortable: false,
      duplicable: false,
      deletable: true,
      hideable: true,
    },
  },
];

export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    id: "marketing-homepage",
    label: "الصفحة الرئيسية",
    description: "الصفحة الرئيسية لموقع FrameID التسويقي",
    icon: "Home",
    route: "/",
    sourceType: "json-file",
    sourceKey: "marketing/homepage",
    schema: HomepageDataSchema,
    sections: HOMEPAGE_SECTIONS,
    previewUrl: "/",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-templates",
    label: "صفحة القوالب",
    description: "صفحة عرض القوالب والتصاميم",
    icon: "Layout",
    route: "/templates",
    sourceType: "json-file",
    sourceKey: "marketing/templates",
    schema: TemplatesPageSchema,
    sections: TEMPLATES_SECTIONS,
    previewUrl: "/templates",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-pricing",
    label: "صفحة الأسعار",
    description: "صفحة الخطط والباقات التسعيرية",
    icon: "CreditCard",
    route: "/pricing",
    sourceType: "json-file",
    sourceKey: "marketing/pricing",
    schema: PricingPageSchema,
    sections: PRICING_SECTIONS,
    previewUrl: "/pricing",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-login",
    label: "صفحة تسجيل الدخول",
    description: "صفحة تسجيل دخول المستخدمين",
    icon: "LogIn",
    route: "/login",
    sourceType: "json-file",
    sourceKey: "marketing/login",
    schema: AuthPageSchema,
    sections: AUTH_SECTIONS,
    previewUrl: "/login",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-signup",
    label: "صفحة إنشاء الحساب",
    description: "صفحة تسجيل المستخدمين الجدد",
    icon: "UserPlus",
    route: "/signup",
    sourceType: "json-file",
    sourceKey: "marketing/signup",
    schema: AuthPageSchema,
    sections: AUTH_SECTIONS,
    previewUrl: "/signup",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-forgot-password",
    label: "صفحة نسيان كلمة المرور",
    description: "صفحة استعادة كلمة المرور",
    icon: "Unlock",
    route: "/forgot-password",
    sourceType: "json-file",
    sourceKey: "marketing/forgot-password",
    schema: AuthPageSchema,
    sections: AUTH_SECTIONS,
    previewUrl: "/forgot-password",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-checkout",
    label: "صفحة الدفع والتفعيل",
    description: "صفحة إتمام الدفع والاشتراك",
    icon: "CreditCard",
    route: "/checkout",
    sourceType: "json-file",
    sourceKey: "marketing/checkout",
    schema: CheckoutPageSchema,
    sections: CHECKOUT_SECTIONS,
    previewUrl: "/checkout",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-success",
    label: "صفحة النجاح",
    description: "صفحة تأكيد الاشتراك الناجح",
    icon: "CheckCircle",
    route: "/success",
    sourceType: "json-file",
    sourceKey: "marketing/success",
    schema: ResultPageSchema,
    sections: RESULT_SECTIONS,
    previewUrl: "/success",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
  {
    id: "marketing-error",
    label: "صفحة الخطأ",
    description: "صفحة فشل المعاملة",
    icon: "AlertTriangle",
    route: "/error",
    sourceType: "json-file",
    sourceKey: "marketing/error",
    schema: ResultPageSchema,
    sections: RESULT_SECTIONS,
    previewUrl: "/error",
    permissions: { view: "page-studio:view", edit: "page-studio:edit" },
  },
];

export function getPageDefinition(pageId: string): PageDefinition | undefined {
  return PAGE_DEFINITIONS.find((p) => p.id === pageId);
}

export function getAllPageDefinitions(): PageDefinition[] {
  return PAGE_DEFINITIONS;
}