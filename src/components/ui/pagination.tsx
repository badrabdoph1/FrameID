"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex size-9 items-center justify-center rounded-[var(--radius-control)] text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-white/30">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "flex size-9 items-center justify-center rounded-[var(--radius-control)] text-sm transition",
              page === currentPage
                ? "bg-champagne text-ink font-semibold"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex size-9 items-center justify-center rounded-[var(--radius-control)] text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}
