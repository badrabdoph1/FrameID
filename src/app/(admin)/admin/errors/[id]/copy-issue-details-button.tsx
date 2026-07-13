"use client";

import { ClipboardCopy } from "lucide-react";
import { useState } from "react";

export function CopyIssueDetailsButton({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      <ClipboardCopy className="size-4" aria-hidden />
      {copied ? "تم النسخ" : "نسخ جميع التفاصيل"}
    </button>
  );
}
