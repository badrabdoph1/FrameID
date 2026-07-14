"use client";

import { CheckCircle2, Circle } from "lucide-react";

type ProgressSummaryProps = {
  completed: number;
  total: number;
};

export function ProgressSummary({ completed, total }: ProgressSummaryProps) {
  if (completed >= total) return null;

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i}>
            {i < completed ? (
              <CheckCircle2 className="size-4 text-emerald-300" aria-hidden />
            ) : (
              <Circle className="size-4 text-white/30" aria-hidden />
            )}
          </span>
        ))}
      </div>
      <span className="text-sm font-black text-white/60">
        {completed} من {total} خطوات مكتملة
      </span>
    </div>
  );
}
