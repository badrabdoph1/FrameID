"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Share2, Palette } from "lucide-react";
import type { Recommendation } from "@/modules/guidance";

type QuickActionsProps = {
  nextAction: Recommendation | null;
  siteUrl: string;
  isSiteComplete: boolean;
  isPublished: boolean;
};

export function QuickActions({ nextAction, siteUrl, isSiteComplete, isPublished }: QuickActionsProps) {
  if (isSiteComplete && isPublished) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:gap-3">
        <Link
          href={siteUrl}
          target="_blank"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20"
        >
          <Share2 className="size-4" aria-hidden />
          شارك موقعك
        </Link>
        <Link
          href="/dashboard/templates"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white"
        >
          <Palette className="size-4" aria-hidden />
          جرّب قالب جديد
        </Link>
      </div>
    );
  }

  if (nextAction) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:gap-3">
        <Link
          href={nextAction.href}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20"
        >
          {nextAction.title}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <Link
          href={siteUrl}
          target="_blank"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white"
        >
          <ExternalLink className="size-4" aria-hidden />
          افتح الموقع كعميل
        </Link>
      </div>
    );
  }

  return null;
}
