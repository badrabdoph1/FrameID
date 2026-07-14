const siteStatuses: Record<string, string> = {
  PUBLISHED: "منشور",
  DRAFT: "مسودة",
  EXPIRED: "منتهي",
  SUSPENDED: "موقوف",
  ACTIVE: "نشط",
  ARCHIVED: "مؤرشف",
};

const domainStatuses: Record<string, string> = {
  VERIFIED: "تم التحقق",
  PENDING: "بانتظار التحقق",
  FAILED: "فشل التحقق",
  DISABLED: "معطل",
};

const sectionTypes: Record<string, string> = {
  HERO: "الواجهة الرئيسية",
  GALLERY: "معرض الأعمال",
  PACKAGES: "الباقات",
  EXTRAS: "الخدمات الإضافية",
  CONTACT: "التواصل",
  CTA: "دعوة لاتخاذ إجراء",
  ABOUT: "نبذة",
  TESTIMONIALS: "آراء العملاء",
};

export function siteStatusLabel(status: string) {
  return siteStatuses[status] ?? status;
}

export function domainStatusLabel(status: string) {
  return domainStatuses[status] ?? status;
}

export function sectionTypeLabel(type: string) {
  return sectionTypes[type] ?? type;
}

export function visibilityLabel(visible: boolean) {
  return visible ? "ظاهر" : "مخفي";
}

export function enabledLabel(enabled: boolean) {
  return enabled ? "مفعّل" : "معطّل";
}
