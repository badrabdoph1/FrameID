"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Share2 } from "lucide-react";

type CompletedStateProps = {
  siteUrl: string;
};

export function CompletedState({ siteUrl }: CompletedStateProps) {
  const [copied, setCopied] = useState(false);

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(110,231,183,0.08),rgba(255,255,255,0.02)),#111720] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="border-b border-emerald-300/12 bg-[linear-gradient(135deg,rgba(110,231,183,0.12),rgba(110,231,183,0.04))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-300/15 text-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.3)] sm:size-14">
            <CheckCircle2 className="size-6 sm:size-7" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-[#fff7e8] sm:text-xl">
              موقعك جاهز وشغال!
            </h2>
            <p className="mt-0.5 text-sm font-bold text-white/60">
              شاركه مع عملائك وابدأ استقبل حجوزات.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <button
          type="button"
          onClick={copySiteUrl}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 text-sm font-black text-[#0a2e1f] shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-200"
        >
          {copied ? <CheckCircle2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "اتنسخ!" : "انسخ رابط موقعك"}
        </button>
        <Link
          href={siteUrl}
          target="_blank"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 text-sm font-black text-emerald-200 no-underline transition hover:-translate-y-0.5 hover:bg-emerald-300/16"
        >
          <Share2 className="size-4" aria-hidden />
          افتح موقعك وشاركه
        </Link>
      </div>

      <div className="border-t border-white/8 px-4 py-3 sm:px-5">
        <p className="text-center text-xs font-bold text-white/50 sm:text-sm">
          عايز تغير شكل موقعك؟{" "}
          <Link href="/dashboard/templates" className="text-[#f3cf73] no-underline hover:text-[#ffe08a]">
            جرّب قالب مختلف
          </Link>
        </p>
      </div>
    </div>
  );
}
