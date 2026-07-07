"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-control)] bg-white/10 px-2 py-1 text-xs text-white/80 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100",
          className,
        )}
      >
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/10" />
      </div>
    </div>
  );
}
