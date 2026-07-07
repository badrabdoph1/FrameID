import type { ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AdminToolbarProps = {
  children?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  bulkActions?: ReactNode;
  className?: string;
};

export function AdminToolbar({
  children,
  searchPlaceholder = "بحث...",
  searchValue,
  onSearchChange,
  filters,
  bulkActions,
  className,
}: AdminToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-1 items-center gap-2">
        {onSearchChange && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 pr-9 text-sm text-white placeholder:text-white/20 transition focus:border-white/20 focus:outline-none"
            />
          </div>
        )}
        {filters && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-white/25" />
            {filters}
          </div>
        )}
      </div>
      {bulkActions && (
        <div className="flex items-center gap-2">{bulkActions}</div>
      )}
      {children}
    </div>
  );
}
