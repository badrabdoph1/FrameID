"use client";

import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { cn } from "@/lib/utils/cn";
import { getNotificationLogs } from "./actions";

const iconMap: Record<string, typeof Bell> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<string, string> = {
  success: "text-success bg-success/10",
  error: "text-danger bg-danger/10",
  warning: "text-warning bg-warning/10",
  info: "text-signal bg-signal/10",
};

const labels: Record<string, string> = {
  success: "نجاح",
  error: "خطأ",
  warning: "تنبيه",
  info: "معلومات",
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  category: string | null;
  userId: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 30;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const result = await getNotificationLogs({
      type: typeFilter || undefined,
      page,
      pageSize,
    });
    setLogs(result.entries as unknown as NotificationItem[]);
    setTotal(result.total);
    setLoading(false);
  }, [typeFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminPageShell
      badge="الإشعارات"
      title="مركز الإشعارات"
      description="سجل الإشعارات والتنبيهات والأخطاء"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الإشعارات" }]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">جميع الأنواع</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
            <option value="warning">تنبيه</option>
            <option value="info">معلومات</option>
          </select>
          <Button
            onClick={loadLogs}
            variant="secondary"
            className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
          >
            تحديث
          </Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-white/40">
              جارٍ التحميل...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/40">
              لا توجد إشعارات مسجلة
            </div>
          ) : (
            logs.map((log) => {
              const Icon = iconMap[log.type] ?? Bell;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                >
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", colorMap[log.type] ?? "")}>
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{log.title}</p>
                      <span className="rounded-[var(--radius-control)] bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40">
                        {labels[log.type] ?? log.type}
                      </span>
                    </div>
                    {log.body && (
                      <p className="mt-0.5 text-sm text-white/50">{log.body}</p>
                    )}
                    <p className="mt-1 text-xs text-white/30">
                      {new Date(log.createdAt).toLocaleString("ar-EG")}
                      {log.category && ` · ${log.category}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-[var(--radius-control)] border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-30"
            >
              السابق
            </button>
            <span className="text-sm text-white/40">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-[var(--radius-control)] border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 disabled:opacity-30"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
