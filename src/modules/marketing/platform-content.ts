import type { TemplateSummary } from "@/modules/themes/theme-registry";

export const platformStats = [
  { label: "رحلة من القالب للوحة التحكم", value: "1" },
  { label: "موقع ورابط وتجربة", value: "تلقائي" },
  { label: "تجربة مجانية", value: "14 يوم" }
];

export const onboardingJourney = [
  {
    title: "يشاهد القوالب",
    body: "يدخل المصور الموقع الرئيسي ويرى قوالب جاهزة بدل صفحة أسعار جامدة."
  },
  {
    title: "يفتح معاينة حية",
    body: "كل قالب يفتح كموقع حقيقي ببيانات تجريبية وصور وباقات."
  },
  {
    title: "يستخدم القالب",
    body: "زر استخدام هذا القالب يحمل الاختيار إلى إنشاء الحساب."
  },
  {
    title: "يبدأ من لوحة التحكم",
    body: "الحساب، الموقع، الرابط الخاص، لوحة التحكم، والاشتراك التجريبي تُنشأ معًا بعد التسجيل."
  }
];

export const photographerControls = [
  "تعديل بياناته",
  "تغيير الباقات والخدمات",
  "رفع الصور وإدارة المعرض",
  "تعديل وسائل التواصل",
  "إدارة SEO",
  "تغيير القالب وإعداداته",
  "نسخ رابط موقعه وفتحه",
  "متابعة الاشتراك والإشعارات"
];

export const adminControls = [
  "العملاء",
  "المواقع",
  "القوالب",
  "المحتوى",
  "الاشتراكات",
  "المدفوعات",
  "النسخ الاحتياطي",
  "الإشعارات",
  "الأمان",
  "التحليلات",
  "إعدادات المنصة"
];

export function getTemplatePreviewImage(template: TemplateSummary) {
  if (template.code === "noir-gold") {
    return "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg";
  }

  return "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85";
}
