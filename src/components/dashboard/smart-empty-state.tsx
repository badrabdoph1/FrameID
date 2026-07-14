"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

type SmartEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  example?: {
    title?: string;
    subtitle?: string;
    features?: string[];
  };
  ctaLabel: string;
  onCtaClick: () => void;
};

export function SmartEmptyState({
  icon: Icon,
  title,
  description,
  hint,
  example,
  ctaLabel,
  onCtaClick,
}: SmartEmptyStateProps) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-[1.5rem] border border-white/12 bg-[#111720] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-8">
      <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-300/20 to-amber-300/8 text-[#f3cf73] shadow-[0_0_24px_rgba(243,207,115,0.2)] sm:size-20">
        <Icon className="size-7 sm:size-8" aria-hidden />
      </span>

      <h2 className="mt-5 text-lg font-black text-[#fff7e8] sm:text-xl">
        {title}
      </h2>

      <p className="mt-3 text-sm font-bold leading-7 text-white/60 sm:text-base sm:leading-8">
        {description}
      </p>

      {hint ? (
        <p className="mt-2 text-xs font-bold text-white/45 sm:text-sm">
          {hint}
        </p>
      ) : null}

      {example ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-right">
          <p className="text-xs font-black text-white/50">مثال:</p>
          {example.title ? (
            <p className="mt-1 text-sm font-black text-[#fff7e8]">{example.title}</p>
          ) : null}
          {example.subtitle ? (
            <p className="mt-0.5 text-xs font-bold text-[#f3cf73]">{example.subtitle}</p>
          ) : null}
          {example.features && example.features.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {example.features.map((feature, i) => (
                <li key={i} className="text-xs font-bold text-white/50">
                  • {feature}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onCtaClick}
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-6 text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/30"
      >
        {ctaLabel}
        <ArrowLeft className="size-4" aria-hidden />
      </button>
    </div>
  );
}
