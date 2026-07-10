import { MessageCircle } from "lucide-react";

import { getSupportSettings, toWhatsappHref } from "@/modules/support/support-settings";

export const PASSWORD_RECOVERY_SUPPORT_MESSAGE =
  "نأسف لا يمكن استرداد كلمة المرور في الوقت الحالي، برجاء التواصل مع الدعم الفني.";

export async function PasswordRecoverySupportCard() {
  let whatsappHref = toWhatsappHref("01038434472", "مرحبًا، لا أستطيع استرداد كلمة المرور في FrameID وأحتاج دعم فني.");

  try {
    const settings = await getSupportSettings();
    whatsappHref = toWhatsappHref(settings.phone, "مرحبًا، لا أستطيع استرداد كلمة المرور في FrameID وأحتاج دعم فني.");
  } catch {
    // Keep the default support number if settings are unavailable.
  }

  return (
    <div className="mb-4 overflow-hidden rounded-[1.35rem] border border-emerald-400/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0.035))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.12)]">
      <p className="text-sm font-black leading-7 text-foreground">
        {PASSWORD_RECOVERY_SUPPORT_MESSAGE}
      </p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white no-underline shadow-[0_12px_28px_rgba(16,185,129,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <MessageCircle className="size-4" aria-hidden />
        تواصل مع الدعم الفني واتساب
      </a>
    </div>
  );
}
