export const CUSTOMER_BROADCAST_CATEGORY = "CUSTOMER_BROADCAST";
export const ACTIVATION_TEMPLATE_CATEGORY = "ACTIVATION_MESSAGE_TEMPLATE";

export type CustomerMessageTone = "info" | "success" | "warning" | "danger";

export const activationTemplateDefinitions = [
  {
    key: "trial",
    label: "رسالة طلب التفعيل / الحساب التجريبي",
    defaultTitle: "حسابك تجريبي برجاء التأكد من التفعيل",
    defaultBody: "فعّل الاشتراك قبل نهاية الفترة التجريبية حتى يظل موقعك متاحًا للعملاء.",
    tone: "warning" as const,
  },
  {
    key: "pending-review",
    label: "رسالة انتظار المراجعة",
    defaultTitle: "طلب التفعيل قيد المراجعة",
    defaultBody: "تم إرسال إثبات الدفع. سنراجع الطلب ونفعّل الاشتراك فور التأكد.",
    tone: "warning" as const,
  },
  {
    key: "active",
    label: "رسالة التفعيل الناجح",
    defaultTitle: "اشتراكك مفعل",
    defaultBody: "اشتراكك مفعل والموقع جاهز للتشغيل والمشاركة مع عملائك.",
    tone: "success" as const,
  },
  {
    key: "rejected",
    label: "رسالة الرفض",
    defaultTitle: "تم رفض طلب التفعيل",
    defaultBody: "برجاء مراجعة بيانات الدفع أو إرسال إثبات صحيح من صفحة الاشتراك.",
    tone: "danger" as const,
  },
  {
    key: "expired",
    label: "رسالة انتهاء أو إيقاف الاشتراك",
    defaultTitle: "الاشتراك يحتاج إجراء",
    defaultBody: "راجع الاشتراك حتى يظل الموقع شغال للعملاء.",
    tone: "danger" as const,
  },
] as const;

export type ActivationTemplateKey = (typeof activationTemplateDefinitions)[number]["key"];

export type ActivationTemplateValue = {
  key: ActivationTemplateKey;
  label: string;
  title: string;
  body: string;
  tone: CustomerMessageTone;
};

export function validateMessageTone(value: string): CustomerMessageTone {
  if (value === "success" || value === "warning" || value === "danger") return value;
  return "info";
}

export function getActivationTemplateDefinition(key: string) {
  return activationTemplateDefinitions.find((template) => template.key === key);
}
