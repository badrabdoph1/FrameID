"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import type { Recommendation } from "@/modules/guidance";
import { useGuidance } from "@/modules/guidance";

type GrowthSuggestionProps = {
  suggestion: Recommendation | null;
};

export function GrowthSuggestion({ suggestion }: GrowthSuggestionProps) {
  const { state, actions } = useGuidance();

  if (!suggestion) return null;
  if (state.dismissedSuggestions.includes(suggestion.id)) return null;

  const Icon = suggestion.icon;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    actions.dismissSuggestion(suggestion.id);
  };

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#111720] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_18px_48px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute left-3 top-3 z-10 grid size-8 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
        aria-label="إخفاء الاقتراح"
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(243,207,115,0.08),rgba(255,255,255,0.02))] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/12 text-[#f3cf73] shadow-sm">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-[#fff7e8] sm:text-base">
              اقتراح لتطوير موقعك
            </strong>
            <small className="mt-0.5 block truncate text-[0.68rem] font-bold text-white/55 sm:text-xs">
              تحسين {suggestion.impact === "high" ? "مهم" : suggestion.impact === "medium" ? "متوسط" : "بسيط"}
            </small>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-base font-black text-[#fff7e8] sm:text-lg">
          {suggestion.title}
        </h3>
        <p className="mt-2 text-sm font-bold leading-7 text-white/60">
          {suggestion.description}
        </p>

        <Link
          href={suggestion.href}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#f3cf73] px-4 py-2.5 text-sm font-black text-[#17120a] no-underline transition hover:-translate-y-0.5 hover:bg-[#ffe08a]"
        >
          {suggestion.type === "suggestion" ? "نفذ الاقتراح" : "ابدأ الآن"}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
