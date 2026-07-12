"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type DashboardSiteActionsProps = {
  siteUrl: string;
  className?: string;
};

export function DashboardSiteActions({ siteUrl, className }: DashboardSiteActionsProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const ownerViewUrl = `${siteUrl}${siteUrl.includes("?") ? "&" : "?"}ownerView=1`;

  async function copySiteUrl() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API is unavailable");
      await navigator.clipboard.writeText(siteUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>
      <Link
        href={ownerViewUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-center text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151d] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden />
        شاهد الموقع كما يراه العميل
      </Link>
      <button
        type="button"
        onClick={copySiteUrl}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 text-center text-sm font-black text-[#ffe49a] transition-[background-color,border-color,color] duration-200 hover:border-amber-300/35 hover:bg-amber-300/16 hover:text-[#fff1be] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151d] motion-reduce:transition-none"
        aria-live="polite"
      >
        {copyStatus === "copied" ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-300" aria-hidden />
        ) : (
          <Copy className="size-4 shrink-0" aria-hidden />
        )}
        {copyStatus === "copied"
          ? "تم نسخ رابط الموقع"
          : copyStatus === "error"
            ? "تعذر النسخ — حاول مجددًا"
            : "انسخ رابط الموقع لإرساله للعميل"}
      </button>
    </div>
  );
}
