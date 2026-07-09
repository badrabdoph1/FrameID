import { NextResponse } from "next/server";

import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, getSupportSettings, toWhatsappHref } from "@/modules/support/support-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSupportSettings();
    return NextResponse.json({
      phone: settings.phone,
      whatsappHref: toWhatsappHref(settings.phone),
    });
  } catch {
    return NextResponse.json({
      phone: DEFAULT_SUPPORT_WHATSAPP_NUMBER,
      whatsappHref: toWhatsappHref(DEFAULT_SUPPORT_WHATSAPP_NUMBER),
    });
  }
}
