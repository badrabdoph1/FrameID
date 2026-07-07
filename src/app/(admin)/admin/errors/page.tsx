"use client";

import { ClipboardCopy, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatErrorForClipboard } from "@/lib/errors/format-error";
import { getErrorLogs, getErrorStats, resolveError } from "./actions";

type ErrorLogItem = {
  id: string;
  code: string;
  message: string;
  category: string;
  level: string;
  requestId: string | null;
  correlationId: string | null;
  route: string | null;
  userId: string | null;
  platform: string | null;
  browser: string | null;
  stack: string | null;
  cause: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
};

export default function AdminErrorCenterPage() {
  const [logs, setLogs] = useState<ErrorLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    unresolved: number;
    byCategory: { category: string; count: number }[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLogItem | null>(null);
  const pageSize = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const result = await getErrorLogs({
      search: search || undefined,
      category: categoryFilter || undefined,
      level: levelFilter || undefined,
      page,
      pageSize,
    });
    setLogs(result.entries as unknown as ErrorLogItem[]);
    setTotal(result.total);
    setLoading(false);
  }, [search, categoryFilter, levelFilter, page]);

  const loadStats = useCallback(async () => {
    const s = await getErrorStats();
    setStats(s);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleResolve = async (id: string) => {
    await resolveError(id);
    loadLogs();
    loadStats();
  };

  const handleCopy = (log: ErrorLogItem) => {
    const text = formatErrorForClipboard({
      code: log.code,
      message: log.message,
      requestId: log.requestId ?? "",
      correlationId: log.correlationId ?? undefined,
      route: log.route ?? undefined,
      timestamp: log.createdAt,
      userId: log.userId ?? undefined,
      platform: log.platform ?? undefined,
      browser: log.browser ?? undefined,
      stack: log.stack ?? undefined,
      cause: log.cause ?? undefined,
    });
    navigator.clipboard.writeText(text);
  };

  const totalPages = Math.ceil(total / pageSize);

  const levelColors: Record<string, string> = {
    ERROR: "text-danger bg-danger/10",
    FATAL: "text-danger bg-danger/20",
    WARN: "text-warning bg-warning/10",
    INFO: "text-signal bg-signal/10",
    DEBUG: "text-muted-foreground bg-muted",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">مركز الأخطاء</h1>
          <p className="mt-1 text-sm text-white/40">
            سجل الأخطاء وإدارة المشكلات
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/40">إجمالي الأخطاء</p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-bold text-danger">{stats.unresolved}</p>
            <p className="text-xs text-white/40">غير محلولة</p>
          </div>
          {stats.byCategory.slice(0, 2).map((c) => (
            <div key={c.category} className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-bold text-white">{c.count}</p>
              <p className="text-xs text-white/40">{c.category}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="بحث في الأخطاء..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border-white/10 bg-white/[0.04] pr-10 text-white placeholder:text-white/30"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">جميع التصنيفات</option>
          <option value="AUTH">المصادقة</option>
          <option value="UPLOAD">الرفع</option>
          <option value="PAYMENT">الدفع</option>
          <option value="SITE">الموقع</option>
          <option value="CONTENT">المحتوى</option>
          <option value="DB">قاعدة البيانات</option>
          <option value="ADMIN">الإدارة</option>
          <option value="BACKUP">النسخ الاحتياطي</option>
          <option value="SECURITY">الأمان</option>
          <option value="VALIDATION">التحقق</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">جميع المستويات</option>
          <option value="ERROR">خطأ</option>
          <option value="FATAL">خطأ حرج</option>
          <option value="WARN">تحذير</option>
        </select>
        <Button
          onClick={() => { loadLogs(); loadStats(); }}
          variant="secondary"
          className="shrink-0 border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
        >
          <RotateCcw className="size-4" />
          تحديث
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/40">
              <th className="px-4 py-3 text-right font-medium">الكود</th>
              <th className="px-4 py-3 text-right font-medium">الرسالة</th>
              <th className="px-4 py-3 text-right font-medium">التصنيف</th>
              <th className="px-4 py-3 text-right font-medium">المستوى</th>
              <th className="px-4 py-3 text-right font-medium">الوقت</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                  جارٍ التحميل...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                  لا توجد أخطاء مسجلة
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      className="font-mono text-xs text-champagne transition hover:text-champagne-strong"
                    >
                      {log.code}
                    </button>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-white/80">
                    {log.message}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-[var(--radius-control)] bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">
                      {log.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-[var(--radius-control)] px-2 py-0.5 text-xs font-medium", levelColors[log.level] ?? "")}>
                      {log.level}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-white/40">
                    {new Date(log.createdAt).toLocaleString("ar-EG")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-[var(--radius-control)] px-2 py-0.5 text-xs",
                      log.resolved ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
                    )}>
                      {log.resolved ? "تم الحل" : "مفتوح"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(log)}
                        className="rounded-[var(--radius-control)] p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white/70"
                        aria-label="نسخ"
                      >
                        <ClipboardCopy className="size-4" />
                      </button>
                      {!log.resolved && (
                        <button
                          onClick={() => handleResolve(log.id)}
                          className="rounded-[var(--radius-control)] p-1.5 text-white/30 transition hover:bg-white/10 hover:text-success"
                          aria-label="حل المشكلة"
                        >
                          <RotateCcw className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-[var(--radius-control)] border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-30"
          >
            السابق
          </button>
          <span className="text-sm text-white/40">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-[var(--radius-control)] border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-30"
          >
            التالي
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
          role="dialog"
          aria-modal="true"
          aria-label="تفاصيل الخطأ"
        >
          <div
            className="w-full max-w-lg rounded-[var(--radius-panel)] border border-white/10 bg-[#1a1a1a] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">تفاصيل الخطأ</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-[var(--radius-control)] p-1.5 text-white/30 hover:bg-white/10 hover:text-white/70"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">الكود</span>
                <span className="font-mono text-champagne">{selectedLog.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">الرسالة</span>
                <span className="text-white/80">{selectedLog.message}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">التصنيف</span>
                <span className="text-white/60">{selectedLog.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">المستوى</span>
                <span className={cn("font-medium", levelColors[selectedLog.level])}>{selectedLog.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Request ID</span>
                <span className="font-mono text-xs text-white/50">{selectedLog.requestId ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Correlation ID</span>
                <span className="font-mono text-xs text-white/50">{selectedLog.correlationId ?? "—"}</span>
              </div>
              {selectedLog.route && (
                <div className="flex justify-between">
                  <span className="text-white/40">المسار</span>
                  <span className="text-white/50">{selectedLog.route}</span>
                </div>
              )}
              {selectedLog.userId && (
                <div className="flex justify-between">
                  <span className="text-white/40">المستخدم</span>
                  <span className="text-white/50">{selectedLog.userId}</span>
                </div>
              )}
              {selectedLog.platform && (
                <div className="flex justify-between">
                  <span className="text-white/40">المنصة</span>
                  <span className="text-white/50">{selectedLog.platform}</span>
                </div>
              )}
              {selectedLog.browser && (
                <div className="flex justify-between">
                  <span className="text-white/40">المتصفح</span>
                  <span className="text-white/50">{selectedLog.browser}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">الوقت</span>
                <span className="text-white/50">{new Date(selectedLog.createdAt).toLocaleString("ar-EG")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">الحالة</span>
                <span className={selectedLog.resolved ? "text-success" : "text-warning"}>
                  {selectedLog.resolved ? "تم الحل" : "مفتوح"}
                </span>
              </div>
            </div>

            {selectedLog.stack && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">
                  Stack Trace (Dev)
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-[var(--radius-control)] bg-black/30 p-3 text-xs text-white/40">
                  {selectedLog.stack}
                </pre>
              </details>
            )}

            {selectedLog.cause && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">
                  السبب (Dev)
                </summary>
                <pre className="mt-2 max-h-20 overflow-auto rounded-[var(--radius-control)] bg-black/30 p-3 text-xs text-white/40">
                  {selectedLog.cause}
                </pre>
              </details>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => handleCopy(selectedLog)}
                className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ClipboardCopy className="size-4" />
                نسخ التفاصيل
              </button>
              {!selectedLog.resolved && (
                <button
                  onClick={() => handleResolve(selectedLog.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-success/20 px-4 py-2 text-sm text-success transition hover:bg-success/30"
                >
                  <RotateCcw className="size-4" />
                  تم الحل
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
