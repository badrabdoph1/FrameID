import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const tones = {
  default: "bg-white/[0.06] text-white/60",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-sky-500/10 text-sky-400",
  champagne: "bg-champagne/10 text-champagne",
} as const;

const dotColors = {
  default: "bg-white/30",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  champagne: "bg-champagne",
} as const;

type AdminStatusBadgeProps = {
  tone?: keyof typeof tones;
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

export function AdminStatusBadge({
  tone = "default",
  dot = true,
  children,
  className,
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn("size-[6px] rounded-full", dotColors[tone])} />
      )}
      {children}
    </span>
  );
}
