export const DEFAULT_SUPPORT_WHATSAPP_NUMBER = "01038434472";

export function normalizeEgyptianWhatsappNumber(value: string) {
  const digits = value.replace(/\D/gu, "");
  if (!digits) return DEFAULT_SUPPORT_WHATSAPP_NUMBER;
  if (digits.startsWith("20")) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.startsWith("10") || digits.startsWith("11") || digits.startsWith("12") || digits.startsWith("15")) {
    return `0${digits}`;
  }
  return digits;
}

export function toWhatsappHref(phone: string, message = "مرحبًا، أحتاج دعم فني في FrameID.") {
  const normalized = normalizeEgyptianWhatsappNumber(phone);
  const digits = normalized.replace(/\D/gu, "");
  const international = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
