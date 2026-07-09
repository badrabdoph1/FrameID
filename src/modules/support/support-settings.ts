import { prisma } from "@/lib/prisma";

export const DEFAULT_SUPPORT_WHATSAPP_NUMBER = "01038434472";
export const SUPPORT_SETTINGS_KEY = "platform.support.whatsapp";

type SupportSettingsValue = {
  phone?: unknown;
};

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

function parseSupportSettingsValue(value: unknown) {
  if (!value || typeof value !== "object") return { phone: DEFAULT_SUPPORT_WHATSAPP_NUMBER };
  const settings = value as SupportSettingsValue;
  return {
    phone: typeof settings.phone === "string" && settings.phone.trim()
      ? normalizeEgyptianWhatsappNumber(settings.phone)
      : DEFAULT_SUPPORT_WHATSAPP_NUMBER,
  };
}

export async function getSupportSettings() {
  const row = await prisma.featureFlag.findUnique({
    where: {
      key_scope_tenantId_siteId: {
        key: SUPPORT_SETTINGS_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
      },
    },
    select: { value: true },
  });

  return parseSupportSettingsValue(row?.value);
}

export async function saveSupportWhatsappNumber(phone: string) {
  const normalized = normalizeEgyptianWhatsappNumber(phone);
  await prisma.featureFlag.upsert({
    where: {
      key_scope_tenantId_siteId: {
        key: SUPPORT_SETTINGS_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
      },
    },
    create: {
      key: SUPPORT_SETTINGS_KEY,
      scope: "PLATFORM",
      enabled: true,
      value: { phone: normalized },
    },
    update: {
      enabled: true,
      value: { phone: normalized },
    },
  });

  return normalized;
}
