import Link from "next/link";
import { Headphones, LockKeyhole, RefreshCw } from "lucide-react";

import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, toWhatsappHref } from "@/modules/support/support-utils";

export function SiteExpiredPage() {
  const supportHref = toWhatsappHref(DEFAULT_SUPPORT_WHATSAPP_NUMBER);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.16),transparent_34%),#080a0f] px-4 py-10 text-[#fff7e8]">
      <section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-300/18 bg-[#111720]/95 text-center shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="border-b border-white/10 bg-amber-300/[0.06] p-6">
          <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-amber-300/14 text-[#f3cf73] shadow-[0_0_36px_rgba(243,207,115,0.18)]">
            <LockKeyhole className="size-7" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-black">الموقع غير متاح مؤقتًا</h1>
          <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-7 text-white/58">
            انتهت مدة التجربة أو الاشتراك. يمكن لصاحب الموقع تسجيل الدخول وتجديد التفعيل لإعادة تشغيل الموقع فورًا.
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline transition hover:bg-[#ffe08a]">
            <RefreshCw className="size-4" aria-hidden />
            تفعيل / تجديد
          </Link>
          <a href={supportHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/22 bg-emerald-400/10 px-4 text-sm font-black text-emerald-200 no-underline transition hover:bg-emerald-400/16 hover:text-white">
            <Headphones className="size-4" aria-hidden />
            الدعم الفني
          </a>
        </div>
      </section>
    </main>
  );
}
