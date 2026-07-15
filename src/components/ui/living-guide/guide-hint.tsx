"use client";

import type { LivingGuideResult } from "@/lib/living-guide/use-living-guide";

export function GuideHint({ guide }: { guide: LivingGuideResult }) {
  const { message, phase } = guide;
  if (!message) return null;

  const showHint = phase === "hint-only";
  const description = message.descriptionShort || message.description;

  if (!showHint) return null;

  return (
    <div
      className="lg-hint pointer-events-none fixed z-50"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="lg-hint-appear max-w-xs rounded-xl border border-white/[0.08] bg-[rgba(15,18,25,0.85)] px-3 py-2 text-center backdrop-blur-md">
        <p className="text-[11px] font-medium leading-4 text-white/50">
          {description}
        </p>
      </div>
    </div>
  );
}
