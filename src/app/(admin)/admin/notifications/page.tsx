"use client";

import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { getNotificationLogs } from "./actions";

const iconMap: Record<string, typeof Bell> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
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

  const typeStyles: Record<string, { bg: string; icon: string }> = {
    success: { bg: "rgba(74, 222, 128, 0.1)", icon: "#4ade80" },
    error: { bg: "rgba(248, 113, 113, 0.1)", icon: "#f87171" },
    warning: { bg: "rgba(243, 207, 115, 0.1)", icon: "#f3cf73" },
    info: { bg: "rgba(96, 165, 250, 0.1)", icon: "#60a5fa" },
  };

  return (
    <AdminPageShell
      badge="الإشعارات"
      title="مركز الإشعارات"
      description="سجل الإشعارات والتنبيهات والأخطاء"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الإشعارات" }]}
    >
      <div style={{ display: "grid", gap: 14 }}>
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{
              borderRadius: "var(--radius-control)",
              border: "1px solid rgba(245, 234, 214, 0.12)",
              background: "rgba(255, 255, 255, 0.04)",
              padding: "8px 14px",
              fontSize: "0.85rem",
              color: "#f5ead6",
              outline: "none",
            }}
          >
            <option value="">جميع الأنواع</option>
            <option value="success">نجاح</option>
            <option value="error">خطأ</option>
            <option value="warning">تنبيه</option>
            <option value="info">معلومات</option>
          </select>
          <button
            onClick={loadLogs}
            className="btn-soft"
            style={{ minHeight: 38 }}
          >
            تحديث
          </button>
        </div>

        {/* List */}
        <div className="admin-compact-list">
          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontSize: "0.85rem", color: "rgba(245, 234, 214, 0.5)" }}>
              جارٍ التحميل...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontSize: "0.85rem", color: "rgba(245, 234, 214, 0.5)" }}>
              لا توجد إشعارات مسجلة
            </div>
          ) : (
            logs.map((log) => {
              const Icon = iconMap[log.type] ?? Bell;
              const ts = typeStyles[log.type] ?? typeStyles.info;
              return (
                <div key={log.id} className="admin-compact-row" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: ts.bg,
                      color: ts.icon,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ color: "#fff7e8", fontSize: "0.9rem" }}>{log.title}</strong>
                      <span
                        style={{
                          borderRadius: "var(--radius-control)",
                          background: "rgba(245, 234, 214, 0.08)",
                          padding: "1px 8px",
                          fontSize: "0.7rem",
                          color: "rgba(245, 234, 214, 0.55)",
                          fontWeight: 900,
                        }}
                      >
                        {labels[log.type] ?? log.type}
                      </span>
                    </div>
                    {log.body && (
                      <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "rgba(245, 234, 214, 0.6)" }}>
                        {log.body}
                      </p>
                    )}
                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(245, 234, 214, 0.4)" }}>
                      {new Date(log.createdAt).toLocaleString("ar-EG")}
                      {log.category && ` · ${log.category}`}
                    </p>
                  </div>
                  <span className="eyebrow" style={{ fontSize: "0.7rem", color: "rgba(245, 234, 214, 0.35)" }}>
                    {log.readAt ? "مقروء" : "جديد"}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-soft"
              style={{ minHeight: 36, opacity: page === 1 ? 0.4 : 1 }}
            >
              السابق
            </button>
            <span style={{ fontSize: "0.85rem", color: "rgba(245, 234, 214, 0.5)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-soft"
              style={{ minHeight: 36, opacity: page === totalPages ? 0.4 : 1 }}
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
