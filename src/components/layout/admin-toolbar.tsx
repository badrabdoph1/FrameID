import type { ReactNode } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type AdminToolbarProps = {
  children?: ReactNode
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: ReactNode
  bulkActions?: ReactNode
  className?: string
}

export function AdminToolbar({
  children, searchPlaceholder = "بحث...", searchValue,
  onSearchChange, filters, bulkActions, className,
}: AdminToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-white/8 bg-white/4 px-3 pr-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50"
            />
          </div>
        )}
        {filters && (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="size-4 shrink-0 text-white/25" />
            {filters}
          </div>
        )}
      </div>
      {bulkActions && <div className="flex flex-wrap items-center gap-2">{bulkActions}</div>}
      {children}
    </div>
  )
}
