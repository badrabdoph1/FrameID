"use client";

import {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  searchable?: boolean;
  sortable?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  isLoading,
  emptyMessage = "لا توجد بيانات",
  pageSize = 10,
  searchable = true,
  sortable = true,
  onRowClick,
  actions,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (!sortable) return;
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey, sortable],
  );

  const processed = useMemo(() => {
    let result = [...data];

    const searchableCols = columns.filter((c) => c.searchable !== false);
    if (search && searchableCols.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchableCols.some((col) => {
          const val = item[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        }),
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp =
          typeof aVal === "number" && typeof bVal === "number"
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (isLoading) return <SkeletonTable />;

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث..."
            className="h-10 w-full rounded-[var(--radius-control)] border border-white/10 bg-white/5 pr-10 pl-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-right text-xs font-medium text-white/50",
                    col.sortable !== false && sortable && "cursor-pointer select-none hover:text-white/80",
                    col.className,
                  )}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortable && col.sortable !== false && sortKey === col.key && (
                      sortDir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-xs font-medium text-white/50">
                  إجراءات
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-white/40"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((item) => (
                <tr
                  key={String(item[keyField])}
                  className={cn(
                    "border-b border-white/5 transition last:border-0",
                    onRowClick && "cursor-pointer hover:bg-white/[0.02]",
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-white/80", col.className)}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as ReactNode) ?? "—"}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-white/50">
        <span>
          {processed.length > 0
            ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, processed.length)} من ${processed.length}`
            : "لا توجد نتائج"}
        </span>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
