"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ThemeBookingFABProps = {
  visible: boolean;
  onConfirm: () => void;
  variant?: "rose" | "noir";
};

export function ThemeBookingFAB({ visible, onConfirm, variant = "rose" }: ThemeBookingFABProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 pb-[calc(.75rem+env(safe-area-inset-bottom))] md:inset-x-auto md:right-6 md:bottom-6 md:pb-0"
      style={{ animation: "themeFabIn .32s cubic-bezier(.22,1,.36,1)" }}
    >
      <button
        type="button"
        onClick={onConfirm}
        className={cn(
          "inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-t-2xl px-6 text-sm font-black shadow-[0_-8px_40px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 md:min-h-12 md:w-auto md:rounded-2xl md:px-8 md:shadow-[0_16px_50px_rgba(0,0,0,0.20)]",
          variant === "noir"
            ? "bg-[#e5c07b] text-black hover:bg-[#f0d090]"
            : "bg-[#d48a9e] text-white hover:bg-[#c77a8e]"
        )}
      >
        <MessageCircle className="size-5" />
        أكد الحجز
      </button>
    </div>
  );
}
