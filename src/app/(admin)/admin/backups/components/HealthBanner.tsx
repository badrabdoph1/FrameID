"use client";

interface HealthBannerProps {
  isBackupStale: boolean;
  staleHours: number | null;
  recentFailure: {
    type: string;
    errorMessage: string | null;
    createdAt: string;
  } | null;
}

export function HealthBanner({ isBackupStale, staleHours, recentFailure }: HealthBannerProps) {
  if (!isBackupStale && !recentFailure) return null;

  return (
    <div className="grid gap-3">
      {isBackupStale ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <div>
            <p className="text-sm font-black text-amber-300">
              {staleHours === null
                ? "لا توجد نسخة احتياطية مكتملة بعد"
                : `مضى على آخر نسخة ${staleHours} ساعة`}
            </p>
            <p className="mt-0.5 text-xs font-bold text-white/40">
              {staleHours === null
                ? "أنشئ أول نسخة الآن لضمان حماية بياناتك."
                : "يُنصح بإنشاء نسخة جديدة في أقرب وقت لضمان سلامة بياناتك."}
            </p>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
            تنبيه
          </span>
        </div>
      ) : null}
      {recentFailure ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3">
          <div>
            <p className="text-sm font-black text-red-300">
              فشل نسخة احتياطية مؤخراً ({formatRelative(recentFailure.createdAt)})
            </p>
            <p className="mt-0.5 text-xs font-bold text-white/40">
              النوع: {recentFailure.type}
              {recentFailure.errorMessage ? ` — ${recentFailure.errorMessage}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
            فشل
          </span>
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(value: string) {
  const date = new Date(value);
  const ms = Date.now() - date.getTime();
  if (ms < 0 || Number.isNaN(date.getTime())) return "الآن";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "قبل لحظات";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}
