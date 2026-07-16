"use client";

import { useState, useCallback } from "react";

interface SourceEntry {
  id: string;
  label: string;
  filePath: string;
  fileName: string;
  githubUrl: string | null;
  lastCommitSha: string | null;
  lastCommitDate: string | null;
}

interface SourceExplorerProps {
  sources: SourceEntry[];
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

export function SourceExplorer({ sources }: SourceExplorerProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">مستكشف الملفات المصدرية</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          الملفات التي تُشكّل المنصة ومصادرها على GitHub.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </section>
  );
}

function SourceCard({ source }: { source: SourceEntry }) {
  const [copied, setCopied] = useState(false);
  const commitDate = formatDate(source.lastCommitDate);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }, [source.filePath]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[14px] text-white/30">
          ❖
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{source.label}</p>
          <p className="mt-1 truncate font-mono text-[11px] font-bold text-white/35" dir="ltr">
            {source.filePath}
          </p>
        </div>
      </div>

      {source.lastCommitSha ? (
        <p className="mb-3 text-[10px] font-bold text-white/25">
          {source.lastCommitSha.slice(0, 8)}
          {commitDate ? ` · ${commitDate}` : ""}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        {source.githubUrl ? (
          <a
            href={source.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-black text-white/60 transition hover:border-[#f3cf73]/30 hover:text-[#f3cf73]"
          >
            فتح على GitHub
            <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h7v7" />
              <path d="M13 3L6 10" />
            </svg>
          </a>
        ) : (
          <button
            disabled
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-white/25 opacity-35"
          >
            فتح على GitHub
          </button>
        )}
        <button
          onClick={handleCopy}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition ${copied ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-white/60 hover:border-[#f3cf73]/30 hover:text-[#f3cf73]"}`}
        >
          {copied ? "تم النسخ" : "نسخ المسار"}
        </button>
      </div>
    </div>
  );
}
