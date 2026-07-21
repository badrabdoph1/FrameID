"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ThemeBookingFABProps = {
  visible: boolean;
  onConfirm: () => void;
  variant?: "rose" | "noir" | "luxe" | "prestige";
};

export function ThemeBookingFAB({ visible, onConfirm, variant = "rose" }: ThemeBookingFABProps) {
  if (!visible) return null;

  const isNoir = variant === "noir";
  const isLuxe = variant === "luxe";
  const isPrestige = variant === "prestige";

  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-28 md:right-8 md:left-auto md:translate-x-0"
      style={{ animation: "themeFabIn .4s cubic-bezier(.34,1.56,.64,1)" }}
    >
      <button
        type="button"
        onClick={onConfirm}
        className={cn(
          "group relative inline-flex min-h-14 items-center gap-3 rounded-full px-7 text-base font-black shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 md:min-h-12 md:px-6 md:text-sm",
          isPrestige
            ? "bg-gradient-to-r from-[#d4a574] to-[#e8c4a0] text-black shadow-[0_12px_40px_rgba(212,165,116,0.5)] hover:shadow-[0_16px_50px_rgba(212,165,116,0.7)]"
            : isLuxe
              ? "bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-white shadow-[0_12px_40px_rgba(255,0,255,0.5)] hover:shadow-[0_16px_50px_rgba(255,0,255,0.7)]"
              : isNoir
                ? "bg-gradient-to-r from-[#f8e5ba] via-[#e5c07b] to-[#c49b50] text-black shadow-[0_12px_40px_rgba(229,192,123,0.5)] hover:shadow-[0_16px_50px_rgba(229,192,123,0.7)]"
                : "bg-gradient-to-r from-[#e8a5b8] via-[#d48a9e] to-[#b87084] text-white shadow-[0_12px_40px_rgba(212,138,158,0.5)] hover:shadow-[0_16px_50px_rgba(212,138,158,0.7)]"
        )}
      >
        <span className={cn(
          "absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60",
          isPrestige ? "bg-[#d4a574]" : isLuxe ? "bg-[#ff00ff]" : isNoir ? "bg-[#e5c07b]" : "bg-[#d48a9e]"
        )} />
        <span className="relative flex items-center gap-3">
          <span className={cn(
            "grid size-8 place-items-center rounded-full",
            isPrestige ? "bg-black/15" : isLuxe ? "bg-white/20" : isNoir ? "bg-black/15" : "bg-white/20"
          )}>
            <MessageCircle className="size-4" style={{ animation: "themeFabPulse 2s ease-in-out infinite" }} />
          </span>
          <span>أكد الحجز</span>
        </span>
      </button>
    </div>
  );
}
