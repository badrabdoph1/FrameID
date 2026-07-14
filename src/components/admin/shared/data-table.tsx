"use client"

import { type ReactNode, useCallback, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Search } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Pagination } from "@/components/ui/pagination"

export type Column<T> = {
  key: string
  header: string
  mobileLabel?: string
  sortable?: boolean
  searchable?: boolean
  render?: (item: T) => ReactNode
  className?: string
}

export type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  isLoading?: boolean
  emptyMessage?: string
  emptyState?: ReactNode
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  onRowClick?: (item: T) => void
  actions?: (item: T) => ReactNode
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, keyField, isLoading,
  emptyMessage = "لا توجد بيانات", emptyState,
  pageSize = 10, searchable = true, sortable = true,
  onRowClick, actions, className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSort = useCallback((key: string) => {
    if (!sortable) return
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }, [sortKey, sortable])

  const processed = useMemo(() => {
    let result = [...data]
    const searchableCols = columns.filter((c) => c.searchable !== false)
    if (search && searchableCols.length > 0) {
      const q = search.toLowerCase()
      result = result.filter((item) => searchableCols.some((col) => {
        const val = item[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      }))
    }
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey]; const bVal = b[sortKey]
        if (aVal == null) return 1; if (bVal == null) return -1
        const cmp = typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal : String(aVal).localeCompare(String(bVal))
        return sortDir === "asc" ? cmp : -cmp
      })
    }
    return result
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = processed.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-label="جارٍ تحميل البيانات">
        <div className="flex gap-4 border-b border-white/6 pb-3">
          {[32, 24, 20, 28, 16].map((w, i) => <div key={i} className={`h-4 w-${w} animate-pulse rounded-lg bg-white/5`} />)}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {[32, 24, 20, 28, 16].map((w, j) => <div key={j} className={`h-5 w-${w} animate-pulse rounded-lg bg-white/5`} />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="بحث..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pr-10 pl-4 text-sm text-white outline-none transition focus:border-amber-500/50"
          />
        </div>
      )}

      <div
        role="list"
        aria-label="قائمة البيانات للموبايل"
        className="grid gap-3 md:hidden"
      >
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/4 px-4 py-10 text-center text-sm font-bold text-white/42">
            {emptyState ?? emptyMessage}
          </div>
        ) : (
          paginated.map((item) => {
            const titleColumn = columns[0]
            const title = titleColumn
              ? item[titleColumn.key]
              : item[keyField]

            return (
              <article
                key={String(item[keyField])}
                role="listitem"
                aria-label={String(title ?? item[keyField])}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => {
                  if (!onRowClick) return
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onRowClick(item)
                  }
                }}
                className={cn(
                  "rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
                  onRowClick && "cursor-pointer transition hover:border-amber-500/24 hover:bg-amber-500/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/55",
                )}
              >
                <dl className="grid gap-3">
                  {columns.map((col, index) => (
                    <div
                      key={col.key}
                      className={cn(
                        "grid gap-1 border-b border-white/6 pb-3 last:border-0 last:pb-0",
                        index === 0 && "rounded-xl border border-amber-500/12 bg-amber-500/8 p-3",
                      )}
                    >
                      <dt className="text-[0.68rem] font-black text-white/38">{col.mobileLabel ?? col.header}</dt>
                      <dd className={cn("min-w-0 text-sm font-bold leading-6 text-white/82", index === 0 && "text-base font-black text-[#fff7e8]")}>
                        {col.render ? col.render(item) : (item[col.key] as ReactNode) ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
                {actions && (
                  <div
                    className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {actions(item)}
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-right text-xs font-extrabold text-white/50",
                    col.sortable !== false && sortable && "cursor-pointer select-none hover:text-white/80",
                    col.className,
                  )}
                >
                  {sortable && col.sortable !== false ? <button type="button" onClick={() => handleSort(col.key)} aria-label={`ترتيب حسب ${col.header}`} className="inline-flex min-h-11 items-center gap-1 text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/55">
                    {col.header}{sortKey === col.key ? sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : null}
                  </button> : <span className="inline-flex min-h-11 items-center">{col.header}</span>}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-xs font-extrabold text-white/50">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-sm text-white/40">
                  {emptyState ?? emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((item) => (
                <tr
                  key={String(item[keyField])}
                  className={cn("border-b border-white/5 transition last:border-0", onRowClick && "cursor-pointer hover:bg-white/3")}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-white/80", col.className)}>
                      {col.render ? col.render(item) : (item[col.key] as ReactNode) ?? "—"}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/50">
        <span className="text-xs">
          {processed.length > 0
            ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, processed.length)} من ${processed.length}`
            : "لا توجد نتائج"}
        </span>
        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
