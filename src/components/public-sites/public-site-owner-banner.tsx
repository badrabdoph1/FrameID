import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

export function PublicSiteOwnerBanner() {
  return (
    <aside
      className="sticky top-0 z-[100] border-b border-amber-300/25 bg-[#0b0d12]/95 px-3 py-2 text-[#fff7e8] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl print:hidden"
      aria-label="وضع معاينة مالك الموقع"
      data-owner-view-banner
    >
      <div className="mx-auto flex min-h-10 w-full max-w-6xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-between sm:text-start">
        <p className="flex items-center gap-2 text-xs font-black sm:text-sm">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-300/12 text-[#f3cf73]">
            <Eye className="size-4" aria-hidden />
          </span>
          أنت الآن تشاهد موقعك كما يراه العميل.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 text-xs font-black text-[#f3cf73] no-underline transition-[background-color,border-color,color] hover:border-amber-300/35 hover:bg-amber-300/16 hover:text-[#ffe9a8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12] motion-reduce:transition-none"
        >
          <ArrowRight className="size-3.5" aria-hidden />
          العودة إلى لوحة الإدارة
        </Link>
      </div>
    </aside>
  );
}
