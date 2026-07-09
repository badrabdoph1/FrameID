import { prisma } from "@/lib/prisma";
import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, normalizeEgyptianWhatsappNumber } from "@/modules/support/support-utils";

export { DEFAULT_SUPPORT_WHATSAPP_NUMBER, normalizeEgyptianWhatsappNumber, toWhatsappHref } from "@/modules/support/support-utils";

export const SUPPORT_SETTINGS_KEY = "platform.support.whatsapp";

type SupportSettingsValue = {
  phone?: unknown;
};

function parseSupportSettingsValue(value: unknown) {
  if (!value || typeof value !== "object") return { phone: DEFAULT_SUPPORT_WHATSAPP_NUMBER };
  const settings = value as SupportSettingsValue;
  return {
    phone: typeof settings.phone === "string" && settings.phone.trim()
      ? normalizeEgyptianWhatsappNumber(settings.phone)
      : DEFAULT_SUPPORT_WHATSAPP_NUMBER,
  };
}

async function getSupportSettingsRow() {
  return prisma.featureFlag.findFirst({
    where: {
      key: SUPPORT_SETTINGS_KEY,
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
    } as never,
    select: { id: true, value: true },
  });
}

export async function getSupportSettings() {
  const row = await getSupportSettingsRow();
  return parseSupportSettingsValue(row?.value);
}

export async function saveSupportWhatsappNumber(phone: string) {
  const normalized = normalizeEgyptianWhatsappNumber(phone);
  const existing = await getSupportSettingsRow();

  if (existing) {
    await prisma.featureFlag.update({
      where: { id: existing.id },
      data: { enabled: true, value: { phone: normalized } } as never,
    });
  } else {
    await prisma.featureFlag.create({
      data: {
        key: SUPPORT_SETTINGS_KEY,
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
        enabled: true,
        value: { phone: normalized },
      } as never,
    });
  }

  return normalized;
}
