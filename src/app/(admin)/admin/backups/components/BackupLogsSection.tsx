"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";

interface BackupLogsSectionProps {
  auditLogs: {
    id: string;
    action: string;
    entityId: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }[];
}

const ACTION_FILTERS = [
  { value: "", label: "الكل" },
  { value: "BACKUP", label: "نسخ" },
  { value: "RESTORE", label: "استعادة" },
  { value: "SCHEDULER", label: "جدولة" },
];

export function BackupLogsSection({ auditLogs }: BackupLogsSectionProps) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = actionFilter
    ? auditLogs.filter((log) => log.action.includes(actionFilter))
    : auditLogs;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#fff7e8]">سجل النسخ الاحتياطي</h2>
          <p className="mt-0.5 text-[11px] font-bold text-white/35">
            آخر 20 عملية نسخ واستعادة وجدولة.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-white/25">فلتر:</span>
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActionFilter(f.value)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-black transition ${actionFilter === f.value ? "border border-amber-300/25 bg-amber-300/10 text-[#f3cf73]" : "border border-white/[0.05] text-white/35 hover:text-white/55"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="text-[11px] font-bold text-white/30">
            {actionFilter ? "لا سجلات مطابقة للفلتر." : "لا توجد سجلات بعد."}
          </p>
        ) : (
          filtered.map((log) => {
            const meta = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
              ? log.metadata as Record<string, unknown>
              : {};
            const isSuccess = log.action.includes("COMPLETED") || log.action.includes("VERIFIED") || log.action.includes("REINDEXED");
            const isError = log.action.includes("FAILED") || log.action.includes("REJECTED");
            const isRunning = log.action.includes("STARTED") || log.action.includes("SCHEDULER_RUN");
            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-black/10 px-2.5 py-1.5"
              >
                <span
                  className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isSuccess ? "bg-emerald-400" : isError ? "bg-red-400" : isRunning ? "bg-amber-400" : "bg-white/20"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-white/70">
                    {translateAuditAction(log.action)}
                  </p>
                  <p className="text-[10px] font-bold text-white/25">
                    {formatDate(log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt))} · {log.entityId}
                  </p>
                  {meta.error ? (
                    <p className="mt-0.5 text-[10px] font-bold text-red-400">
                      {String(meta.error)}
                    </p>
                  ) : null}
                  {meta.backupId ? (
                    <p className="text-[9px] font-bold text-white/15">
                      {String(meta.backupId)}
                    </p>
                  ) : null}
                  {meta.durationMs ? (
                    <p className="text-[9px] font-bold text-white/15">
                      {Number(meta.durationMs)}ms
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function translateAuditAction(action: string): string {
  const map: Record<string, string> = {
    "BACKUP_STARTED": "بدء النسخ الاحتياطي",
    "BACKUP_LOCAL_VERIFIED": "تحقق محلي من النسخة",
    "BACKUP_GITHUB_VERIFIED": "تحقق من الرفع على GitHub",
    "BACKUP_COMPLETED": "اكتمل النسخ الاحتياطي",
    "BACKUP_FAILED": "فشل النسخ الاحتياطي",
    "BACKUP_DELETED": "حذف نسخة احتياطية",
    "BACKUP_VERIFIED": "النسخة سليمة",
    "BACKUP_VERIFICATION_FAILED": "فشل التحقق من النسخة",
    "BACKUP_SCHEDULER_RUN": "تشغيل الجدولة التلقائية",
    "BACKUP_REINDEXED_FROM_GITHUB": "إعادة فهرسة نسخة من GitHub",
    "RESTORE_STARTED": "بدء الاستعادة",
    "RESTORE_COMPLETED": "اكتملت الاستعادة",
    "RESTORE_FAILED": "فشلت الاستعادة",
    "RESTORE_REJECTED": "تم رفض الاستعادة",
  };
  return map[action] ?? action;
}
