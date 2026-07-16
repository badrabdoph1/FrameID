"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";

interface PlatformAuditLogProps {
  logs: {
    id: string;
    action: string;
    entityId: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }[];
}

const ACTION_FILTERS = [
  { value: "", label: "الكل" },
  { value: "PLATFORM", label: "تغيير" },
  { value: "GIT", label: "مزامنة" },
  { value: "BACKUP", label: "نسخ" },
  { value: "RESTORE", label: "استعادة" },
  { value: "VERIFY", label: "تحقق" },
];

export function PlatformAuditLog({ logs }: PlatformAuditLogProps) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = actionFilter
    ? logs.filter((log) => log.action.includes(actionFilter))
    : logs;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">سجل عمليات المنصة</h2>
          <p className="mt-1 text-xs font-bold text-white/40">
            آخر العمليات المسجلة على المنصة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-white/30">فلتر:</span>
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActionFilter(f.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition ${actionFilter === f.value ? "border border-amber-300/30 bg-amber-300/10 text-[#f3cf73]" : "border border-white/[0.06] text-white/40 hover:text-white/60"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs font-bold text-white/35">
            {actionFilter ? "لا سجلات مطابقة للفلتر." : "لا توجد سجلات بعد."}
          </p>
        ) : (
          filtered.map((log) => {
            const meta =
              log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
                ? (log.metadata as Record<string, unknown>)
                : {};
            const isSuccess =
              log.action.includes("COMPLETED") ||
              log.action.includes("VERIFIED") ||
              log.action.includes("SUCCESS");
            const isError =
              log.action.includes("FAILED") ||
              log.action.includes("REJECTED") ||
              log.action.includes("ERROR");
            const isRunning =
              log.action.includes("STARTED") ||
              log.action.includes("RUNNING") ||
              log.action.includes("PENDING");
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2"
              >
                <span
                  className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${isSuccess ? "bg-emerald-400" : isError ? "bg-red-400" : isRunning ? "bg-amber-400" : "bg-white/20"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white/80">
                    {translateAuditAction(log.action)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-white/35">
                    {formatDate(log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt))}
                    {log.entityId ? ` · ${log.entityId}` : ""}
                  </p>
                  {meta.error ? (
                    <p className="mt-1 text-[10px] font-bold text-red-400">
                      {String(meta.error)}
                    </p>
                  ) : null}
                  {meta.durationMs ? (
                    <p className="mt-0.5 text-[10px] font-bold text-white/25">
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
    "PLATFORM_CONFIG_UPDATED": "تحديث إعدادات المنصة",
    "PLATFORM_SYNC_STARTED": "بدء مزامنة المنصة",
    "PLATFORM_SYNC_COMPLETED": "اكتملت مزامنة المنصة",
    "PLATFORM_SYNC_FAILED": "فشلت مزامنة المنصة",
    "GIT_SYNC_STARTED": "بدء المزامنة مع Git",
    "GIT_SYNC_COMPLETED": "اكتملت المزامنة مع Git",
    "GIT_SYNC_FAILED": "فشلت المزامنة مع Git",
    "GIT_PUSH_COMPLETED": "تم الرفع إلى Git",
    "GIT_PUSH_FAILED": "فشل الرفع إلى Git",
    "GIT_PULL_COMPLETED": "تم السحب من Git",
    "GIT_PULL_FAILED": "فشل السحب من Git",
    "VERIFY_STARTED": "بدء التحقق",
    "VERIFY_COMPLETED": "اكتمل التحقق",
    "VERIFY_FAILED": "فشل التحقق",
    "BACKUP_STARTED": "بدء النسخ الاحتياطي",
    "BACKUP_COMPLETED": "اكتمل النسخ الاحتياطي",
    "BACKUP_FAILED": "فشل النسخ الاحتياطي",
    "RESTORE_STARTED": "بدء الاستعادة",
    "RESTORE_COMPLETED": "اكتملت الاستعادة",
    "RESTORE_FAILED": "فشلت الاستعادة",
    "RESTORE_REJECTED": "تم رفض الاستعادة",
  };
  return map[action] ?? action;
}
