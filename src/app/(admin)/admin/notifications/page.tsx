"use client";

import { AlertTriangle, Bell, CheckCircle2, Info, RotateCcw, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { getNotificationLogs, getNotificationStats } from "./actions";

const iconMap: Record<string, typeof Bell> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const labels: Record<string, string> = {
  success: "نجاح",
  error: "خطأ",
  warning: "تحذير",
  info: "معلومات",
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  category: string | null;
  userId: string | null;
  tenantId: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationStats = {
  total: number;
  unread: number;
  byType: { type: string; count: number }[];
};

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const pageSize = 30;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getNotificationLogs({ type: typeFilter || undefined, search: search || undefined, page, pageSize });
      setLogs(result.entries as unknown as NotificationItem[]);
      setTotal(result.total);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, page]);

  const loadStats = useCallback(async () => {
    const result = await getNotificationStats();
    setStats(result);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalPages = Math.ceil(total / pageSize);

  const typeStyles: Record<string, { bg: string; icon: string; border: string }> = {
    success: { bg: "rgba(74, 222, 128, 0.1)", icon: "#4ade80", border: "rgba(74, 222, 128, 0.18)" },
    error: { bg: "rgba(248, 113, 113, 0.1)", icon: "#f87171", border: "rgba(248, 113, 113, 0.18)" },
    warning: { bg: "rgba(243, 207, 115, 0.1)", icon: "#f3cf73", border: "rgba(243, 207, 115, 0.18)" },
    info: { bg: "rgba(96, 165, 250, 0.1)", icon: "#60a5fa", border: "rgba(96, 165, 250, 0.18)" },
  };

  return (
    <AdminPageShell
      badge="الإشعارات"
      title="سجل الإشعارات"
      description="سجل موحد للنجاحات والتحذيرات والمعلومات والأخطاء التي تظهر للمستخدمين."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الإشعارات" }]}
    >
      <div className="grid gap-4">
        {stats ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="كل الإشعارات" value={stats.total} />
            <StatCard label="غير مقروء" value={stats.unread} accent="warning" />
            {stats.byType.slice(0, 2).map((item) => (
              <StatCard key={item.type} label={labels[item.type] ?? item.type} value={item.count} />
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="ابحث بالعنوان أو النص أو التصنيف"
              aria-label="البحث في الإشعارات"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/40"
            />
          </label>

          <select
            value={typeFilter}
            onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none transition focus:border-amber-400/40"
          >
            <option value="">جميع الأنواع</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
            <option value="warning">تحذير</option>
            <option value="info">معلومات</option>
          </select>

          <button
            type="button"
            onClick={() => { loadLogs(); loadStats(); }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="size-4" />
            تحديث
          </button>
        </div>

        <div className="grid gap-2">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-white/45">
              جارٍ التحميل...
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center text-sm font-bold text-red-300">تعذر تحميل سجل الإشعارات. استخدم زر التحديث للمحاولة مرة أخرى.</div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-white/45">
              لا توجد إشعارات مسجلة
            </div>
          ) : (
            logs.map((log) => {
              const Icon = iconMap[log.type] ?? Bell;
              const ts = typeStyles[log.type] ?? typeStyles.info;
              return (
                <article
                  key={log.id}
                  className="grid gap-3 rounded-2xl border bg-white/[0.035] p-4 transition hover:bg-white/[0.055] md:grid-cols-[auto_1fr_auto]"
                  style={{ borderColor: ts.border }}
                >
                  <div className="grid size-10 place-items-center rounded-2xl" style={{ background: ts.bg, color: ts.icon }}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-black text-[#fff7e8]">{log.title}</strong>
                      <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[0.68rem] font-black text-white/55">
                        {labels[log.type] ?? log.type}
                      </span>
                      {log.category ? (
                        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[0.68rem] font-black text-white/35">
                          {log.category}
                        </span>
                      ) : null}
                    </div>
                    {log.body ? (
                      <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-black/15 p-3 text-xs leading-6 text-white/58">
                        {log.body}
                      </pre>
                    ) : null}
                    <p className="mt-2 text-xs font-bold text-white/35">
                      {new Date(log.createdAt).toLocaleString("ar-EG")}
                      {log.userId ? ` · المستخدم: ${log.userId}` : ""}
                      {log.tenantId ? ` · العميل: ${log.tenantId}` : ""}
                    </p>
                  </div>

                  <span className="h-fit rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.7rem] font-black text-white/45">
                    {log.readAt ? "مقروء" : "جديد"}
                  </span>
                </article>
              );
            })
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-bold text-white/60 transition hover:bg-white/10 disabled:opacity-30"
            >
              السابق
            </button>
            <span className="text-sm font-bold text-white/40">{page.toLocaleString("ar-EG")} / {totalPages.toLocaleString("ar-EG")}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm font-bold text-white/60 transition hover:bg-white/10 disabled:opacity-30"
            >
              التالي
            </button>
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "warning" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className={accent === "warning" ? "text-2xl font-black text-[#f3cf73]" : "text-2xl font-black text-white"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-bold text-white/40">{label}</p>
    </div>
  );
}
