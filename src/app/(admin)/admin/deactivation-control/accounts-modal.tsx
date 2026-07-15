"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { getPausedAccountsAction } from "@/app/(admin)/admin/deactivation-control/actions";
import { cn } from "@/lib/utils/cn";

type Account = {
  id: string;
  ownerName: string;
  siteName: string;
  siteSlug: string | null;
  email: string;
  createdAt: string;
  endDate: string | null;
  daysOverdue: number;
  status: string;
  reason: string;
};

type SortField = "displayName" | "email" | "createdAt" | "endsAt" | "daysOverdue";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "TRIAL": return "تجربة";
    case "ACTIVE": return "نشط";
    case "TRIAL_EXPIRED": return "تجربة منتهية";
    case "EXPIRED": return "منتهي";
    case "SUSPENDED": return "موقوف";
    default: return status;
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "TRIAL": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
    case "ACTIVE": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    case "TRIAL_EXPIRED": return "bg-red-500/10 text-red-300 border-red-500/20";
    case "EXPIRED": return "bg-red-500/10 text-red-300 border-red-500/20";
    case "SUSPENDED": return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    default: return "bg-white/5 text-white/60 border-white/10";
  }
}

export function AccountsModal({
  open,
  onClose,
  title,
  type,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  type: "trial" | "paid";
  filter: "all" | "expired-active";
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("daysOverdue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPausedAccountsAction(type, {
        search: filter === "expired-active" ? undefined : (debouncedSearch || undefined),
        sortBy: sortBy === "endsAt" ? (type === "trial" ? "trialEndsAt" : "endsAt") : sortBy,
        sortOrder,
        page,
        pageSize,
        filter,
      });
      setAccounts(result.accounts);
      setTotal(result.total);
    } catch {
      setAccounts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type, filter, debouncedSearch, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open, loadAccounts]);

  useEffect(() => {
    const el = backdropRef.current;
    if (!el || !open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }, [sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={backdropRef} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="admin-scale-in relative z-10 flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-white/8 bg-[#0a0a0a] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="mt-0.5 text-[0.75rem] font-extrabold text-white/45">{total} حساب</p>
          </div>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-xl text-white/40 transition hover:bg-white/6 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        {filter === "all" && (
          <div className="shrink-0 border-b border-white/6 px-5 py-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="بحث بالاسم أو البريد..."
                className="w-full rounded-xl border border-white/8 bg-white/[0.04] py-2.5 pr-10 pl-4 text-sm font-extrabold text-white placeholder:text-white/25 focus:border-amber-500/40 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto admin-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-8 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-white/35">
              <Search className="size-10" />
              <p className="text-sm font-extrabold">لا توجد حسابات</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6 text-right">
                  <SortableHeader field="displayName" label="المصور" currentSort={sortBy} currentOrder={sortOrder} onToggle={toggleSort} />
                  <th className="px-4 py-3 text-[0.7rem] font-extrabold text-white/35">الموقع</th>
                  <SortableHeader field="email" label="البريد" currentSort={sortBy} currentOrder={sortOrder} onToggle={toggleSort} />
                  <SortableHeader field="createdAt" label="تاريخ الإنشاء" currentSort={sortBy} currentOrder={sortOrder} onToggle={toggleSort} />
                  <SortableHeader field="endsAt" label="تاريخ الانتهاء" currentSort={sortBy} currentOrder={sortOrder} onToggle={toggleSort} />
                  <SortableHeader field="daysOverdue" label="أيام التجاوز" currentSort={sortBy} currentOrder={sortOrder} onToggle={toggleSort} />
                  <th className="px-4 py-3 text-[0.7rem] font-extrabold text-white/35">الحالة</th>
                  <th className="px-4 py-3 text-[0.7rem] font-extrabold text-white/35">سبب الاستمرار</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                    <td className="max-w-[160px] truncate px-4 py-3 text-sm font-extrabold text-white/85">{account.ownerName}</td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-sm font-extrabold text-white/65">{account.siteName}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-sm text-white/55" dir="ltr">{account.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-white/55">{formatDate(account.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-white/55">{account.endDate ? formatDate(account.endDate) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                        account.daysOverdue > 0 ? "bg-red-500/12 text-red-300" : "bg-emerald-500/10 text-emerald-300",
                      )}>
                        {account.daysOverdue > 0 ? `+${account.daysOverdue}` : account.daysOverdue}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-extrabold", statusTone(account.status))}>
                        {statusLabel(account.status)}
                      </span>
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-xs font-extrabold text-amber-300/70">{account.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > pageSize && (
          <div className="flex shrink-0 items-center justify-between border-t border-white/8 px-5 py-3">
            <span className="text-[0.72rem] font-extrabold text-white/35">
              {Math.min(page * pageSize, total)} من {total}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg text-xs font-extrabold transition",
                      page === pageNum
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                        : "text-white/45 hover:bg-white/6 hover:text-white/80",
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableHeader({
  field,
  label,
  currentSort,
  currentOrder,
  onToggle,
}: {
  field: SortField;
  label: string;
  currentSort: SortField;
  currentOrder: "asc" | "desc";
  onToggle: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(field)}
        className="inline-flex items-center gap-1 text-[0.7rem] font-extrabold text-white/35 transition hover:text-white/60"
      >
        {label}
        {isActive && (currentOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );
}
