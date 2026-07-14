"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, CheckCircle2, ExternalLink } from "lucide-react";

type SiteIdentityCardProps = {
  siteUrl: string;
  isPublished: boolean;
  showPreviewButton: boolean;
};

export function SiteIdentityCard({ siteUrl, isPublished, showPreviewButton }: SiteIdentityCardProps) {
  const [copied, setCopied] = useState(false);

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111720] px-4 py-3 sm:px-5">
      <div className="min-w-0 flex-1">
        <p dir="ltr" className="truncate text-sm font-black text-[#f3cf73]/80 sm:text-base">
          {siteUrl}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copySiteUrl}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.045] px-3 text-xs font-black text-white/78 transition hover:border-amber-300/24 hover:bg-white/[0.075] hover:text-white sm:min-h-11 sm:px-4 sm:text-sm"
        >
          {copied ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <span>{copied ? "اتنسخ" : "انسخ الرابط"}</span>
        </button>

        {showPreviewButton && isPublished ? (
          <Link
            href={siteUrl}
            target="_blank"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#e8c15e] px-3 text-xs font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-amber-500/30 sm:min-h-11 sm:px-4 sm:text-sm"
          >
            <ExternalLink className="size-4" aria-hidden />
            <span>شاهد موقعك</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
