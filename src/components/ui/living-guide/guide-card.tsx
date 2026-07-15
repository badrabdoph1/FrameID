"use client";

import { useState } from "react";
import type { LivingGuideResult } from "@/lib/living-guide/use-living-guide";
import { ACCENT, ACCENT_RGB } from "@/lib/living-guide/types";

export function GuideCard({ guide }: { guide: LivingGuideResult }) {
  const { message, phase, cardPosition, visitLevel, dismiss } = guide;
  const [suppressChecked, setSuppressChecked] = useState(false);

  if (!message) return null;

  const isReturning = phase === "returning";
  const isFading = phase === "halo-fading";
  const isBirth = phase === "card-birth";

  const title =
    visitLevel === "familiar" || visitLevel === "returning"
      ? message.titleShort
      : message.title;
  const description =
    visitLevel === "familiar" || visitLevel === "returning"
      ? message.descriptionShort
      : message.description;

  const handleAction = () => {
    dismiss(suppressChecked);
  };

  return (
    <div
      className="lg-card-wrapper fixed z-50 pointer-events-auto"
      style={{
        left: cardPosition.x,
        top: cardPosition.y,
        maxWidth: 240,
      }}
    >
      <div
        className={`lg-card relative overflow-hidden rounded-2xl border border-white/[0.1] ${
          isReturning
            ? "lg-card-return"
            : isFading
              ? "lg-card-fade"
              : isBirth
                ? "lg-card-birth"
                : ""
        }`}
        style={{
          background: "rgba(15,18,25,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        role="status"
        aria-live="polite"
      >
        <span className="lg-card-reflection pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <span className="lg-card-reflection-line absolute h-full w-[40%] -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </span>

        <div className="relative p-3">
          {title ? (
            <h3 className="lg-stagger text-[13px] font-bold leading-5 text-[#fff7e8]">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="lg-stagger mt-1 text-[11px] font-medium leading-4 text-white/60">
              {description}
            </p>
          ) : null}
          {message.actionLabel ? (
            <button
              type="button"
              onClick={handleAction}
              className="lg-stagger mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-colors hover:brightness-110"
              style={{
                background: `rgba(${ACCENT_RGB},0.15)`,
                color: ACCENT,
              }}
              data-guide-reward
            >
              {message.actionLabel}
            </button>
          ) : null}
          {message.suppressLabel ? (
            <label className="lg-stagger mt-2 flex cursor-pointer items-center gap-1.5 text-[10px] text-white/35 transition-colors hover:text-white/50">
              <input
                type="checkbox"
                checked={suppressChecked}
                onChange={(e) => setSuppressChecked(e.target.checked)}
                className="size-3 accent-[#f3cf73] rounded-sm"
              />
              {message.suppressLabel}
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
