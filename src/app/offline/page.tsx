import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "غير متصل بالإنترنت | FrameID",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-[#0b0d12] px-4 py-8 text-[#fff7e8]">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center text-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl border border-amber-300/18 bg-amber-300/12 text-amber-200">
            <WifiOff className="size-8" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-black">أنت غير متصل بالإنترنت</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm font-bold leading-7 text-white/56">
            سيتم مزامنة البيانات عند عودة الاتصال. يمكنك الرجوع للتطبيق، وعند توفر الإنترنت سيتم تحميل أحدث بيانات تلقائيًا.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <a
              href="."
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-black text-[#17120a] no-underline"
            >
              <RefreshCw className="size-4" aria-hidden />
              إعادة المحاولة
            </a>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/74 no-underline"
            >
              <Home className="size-4" aria-hidden />
              لوحة التحكم
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
