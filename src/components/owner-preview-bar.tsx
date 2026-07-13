import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export function OwnerPreviewBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-amber-300/20 bg-[#0c0e13]/95 px-4 py-2.5 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-amber-300/12 text-[#f3cf73]">
            <LayoutDashboard className="size-3.5" aria-hidden />
          </span>
          <span className="text-xs font-black text-white/70 sm:text-sm">
            أنت الآن تشاهد موقعك كما يراه العميل
          </span>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a] no-underline transition hover:bg-[#ffe08a] sm:min-h-10 sm:px-4 sm:text-sm"
        >
          <ArrowRight className="size-3.5" aria-hidden />
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
