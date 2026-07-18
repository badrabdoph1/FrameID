"use client";

import Link from "next/link";
import { Eye, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { SubscriptionExperiencePreview } from "@/components/subscription/subscription-experience-preview";
import type {
  ResolvedSubscriptionExperience,
  SubscriptionCardVisibilityPreference,
  SubscriptionExperienceBucket,
} from "@/modules/subscription/subscription-experience";

export type CustomerSubscriptionVisibilityRow = {
  bucket: SubscriptionExperienceBucket;
  label: string;
  description: string;
  isCurrent: boolean;
  preference: SubscriptionCardVisibilityPreference;
  experience: ResolvedSubscriptionExperience;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
};

type ActionHandler = (
  type: string,
  title: string,
  description: string,
  formData: FormData,
  danger?: boolean,
) => void;

const selectClass =
  "min-h-10 rounded-lg border border-white/10 bg-black/25 px-3 text-xs font-black text-white/80 outline-none focus:border-amber-300/45";

function sourceLabel(source: ResolvedSubscriptionExperience["visibility"]["source"]) {
  if (source === "customer-override") return "استثناء خاص بهذا العميل";
  if (source === "system-fallback") return "إعداد النظام الاحتياطي";
  return "الإعداد العام";
}

export function CustomerSubscriptionVisibilityCard({
  tenantId,
  rows,
  hasAnyOverride,
  onAction,
}: {
  tenantId: string;
  rows: CustomerSubscriptionVisibilityRow[];
  hasAnyOverride: boolean;
  onAction: ActionHandler;
}) {
  const [preferences, setPreferences] = useState<Record<string, SubscriptionCardVisibilityPreference>>(
    Object.fromEntries(rows.map((row) => [row.bucket, row.preference])),
  );

  useEffect(() => {
    setPreferences(
      Object.fromEntries(rows.map((row) => [row.bucket, row.preference])),
    );
  }, [rows]);

  const saveRow = (row: CustomerSubscriptionVisibilityRow) => {
    const formData = new FormData();
    formData.set("tenantId", tenantId);
    formData.set("bucket", row.bucket);
    formData.set("preference", preferences[row.bucket]);
    onAction(
      "subscription-card-visibility",
      `حفظ ظهور كارت ${row.label}`,
      `سيتم تطبيق الاختيار على حالة «${row.label}» لهذا العميل فقط، مع الحفاظ على بقية الحالات والتخصيصات.`,
      formData,
    );
  };

  const resetAll = () => {
    const formData = new FormData();
    formData.set("tenantId", tenantId);
    onAction(
      "clear-subscription-card-overrides",
      "إرجاع جميع الحالات للإعداد العام",
      "سيتم حذف كل استثناءات رسائل وكروت الاشتراك الخاصة بهذا العميل، وستعود الحالات الخمس للإعدادات العامة.",
      formData,
      true,
    );
  };

  return (
    <section className="rounded-xl border border-white/8 bg-white/[0.025] p-3 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#f3cf73]" aria-hidden />
            <h3 className="text-sm font-black text-[#fff7e8]">ظهور كروت الاشتراك للعميل</h3>
          </div>
          <p className="mt-1 text-xs font-bold leading-5 text-white/40">
            كل حالة مستقلة، والنتيجة أدناه هي نفسها التي يحسبها النظام للعميل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/messages" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-black text-white/55 no-underline hover:text-[#f3cf73]">
            إعدادات رسائل الاشتراك
          </Link>
          <button type="button" onClick={resetAll} disabled={!hasAnyOverride} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-300/20 px-3 text-xs font-black text-red-200/80 disabled:cursor-not-allowed disabled:opacity-35">
            <RotateCcw className="size-3.5" aria-hidden />
            إرجاع جميع الحالات للإعداد العام
          </button>
        </div>
      </header>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <article key={row.bucket} className="grid gap-3 rounded-xl border border-white/8 bg-black/15 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm font-black text-white/85">{row.label}</strong>
                {row.isCurrent ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[0.62rem] font-black text-[#f3cf73]">الحالة الحالية</span> : null}
                <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black ${row.experience.visibility.effective === "visible" ? "bg-emerald-300/10 text-emerald-200" : "bg-red-300/10 text-red-200"}`}>
                  {row.experience.visibility.effective === "visible" ? "ظاهر" : "مخفي"}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold text-white/38">{row.description}</p>
              <p className="mt-1.5 text-[0.68rem] font-black text-white/50">
                مصدر القرار: {sourceLabel(row.experience.visibility.source)}
              </p>
              {row.lastUpdatedAt ? (
                <p className="mt-1 text-[0.65rem] font-bold text-white/32">
                  آخر تعديل {new Date(row.lastUpdatedAt).toLocaleString("ar-EG")} بواسطة {row.lastUpdatedBy ?? "تعديل سابق"}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  aria-label={`إعداد ظهور ${row.label}`}
                  value={preferences[row.bucket]}
                  onChange={(event) => setPreferences((current) => ({ ...current, [row.bucket]: event.target.value as SubscriptionCardVisibilityPreference }))}
                  className={selectClass}
                >
                  <option value="inherit">يتبع الإعداد العام</option>
                  <option value="show">إظهار لهذا العميل</option>
                  <option value="hide">إخفاء لهذا العميل</option>
                </select>
                <button type="button" onClick={() => saveRow(row)} className="min-h-10 rounded-lg bg-[#f3cf73] px-3 text-xs font-black text-[#17120a] hover:bg-[#ffe29a]">
                  حفظ الحالة
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[0.65rem] font-black text-white/35">معاينة الكارت</p>
              <SubscriptionExperiencePreview experience={row.experience} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
