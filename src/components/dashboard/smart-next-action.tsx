"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Recommendation } from "@/modules/guidance";

type SmartNextActionProps = {
  action: Recommendation | null;
};

export function SmartNextAction({ action }: SmartNextActionProps) {
  if (!action) return null;

  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group flex items-center gap-4 rounded-[1.25rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(243,207,115,0.12),rgba(255,255,255,0.04)),#131820] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:shadow-[0_18px_48px_rgba(243,207,115,0.08)] sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f3cf73] text-[#17120a] shadow-lg shadow-amber-500/20 transition group-hover:scale-105 sm:size-14">
        <Icon className="size-5 sm:size-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-[#f3cf73]">الخطوة الجاية</span>
        <span className="mt-0.5 block text-base font-black text-[#fff7e8] sm:text-lg">
          {action.title}
        </span>
        {action.reason ? (
          <span className="mt-1 block text-sm font-bold text-white/55">
            {action.reason}
          </span>
        ) : null}
      </span>
      <span className="hidden shrink-0 rounded-2xl bg-[#f3cf73] px-4 py-2 text-sm font-black text-[#17120a] sm:block">
        ابدأ الآن
      </span>
      <ArrowLeft className="size-5 text-[#f3cf73] sm:hidden" aria-hidden />
    </Link>
  );
}
