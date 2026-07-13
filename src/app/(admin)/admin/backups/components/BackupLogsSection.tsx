"use client";

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

export function BackupLogsSection({ auditLogs }: BackupLogsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">سجل النسخ الاحتياطي</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          آخر 20 عملية نسخ واستعادة وجدولة مسجلة.
        </p>
      </div>
      <div className="space-y-2">
        {auditLogs.length === 0 ? (
          <p className="text-xs font-bold text-white/35">لا توجد سجلات بعد.</p>
        ) : (
          auditLogs.map((log) => {
            const meta = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
              ? log.metadata as Record<string, unknown>
              : {};
            const isSuccess = log.action.includes("COMPLETED") || log.action.includes("VERIFIED") || log.action.includes("REINDEXED");
            const isError = log.action.includes("FAILED") || log.action.includes("REJECTED");
            const isRunning = log.action.includes("STARTED") || log.action.includes("SCHEDULER_RUN");
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
                    {formatDate(log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt))} · {log.entityId}
                  </p>
                  {meta.error ? (
                    <p className="mt-1 text-[10px] font-bold text-red-400">
                      {String(meta.error)}
                    </p>
                  ) : null}
                  {meta.backupId ? (
                    <p className="mt-0.5 text-[10px] font-bold text-white/25">
                      {String(meta.backupId)}
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