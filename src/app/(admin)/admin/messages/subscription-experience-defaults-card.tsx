"use client";

import { useMemo, useState } from "react";
import { Eye, MessageSquareText, Sparkles } from "lucide-react";

import {
  resolveSubscriptionExperience,
  subscriptionExperienceActionDefinitions,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionExperienceActionKind,
  type SubscriptionExperienceActionConfig,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceDefaults,
  type SubscriptionExperienceMessage,
  type SubscriptionExperienceStateConfig,
  type SubscriptionExperienceTimerConfig,
} from "@/modules/subscription/subscription-experience";
import { saveSubscriptionExperienceDefaultsAction } from "@/app/(admin)/admin/messages/actions";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-[#0b0d12]/80 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

type Props = {
  defaults: SubscriptionExperienceDefaults;
  supportWhatsapp: string;
};

type EditableBucket = SubscriptionExperienceBucket;
type EditableBucketPatch = {
  message?: Partial<SubscriptionExperienceMessage>;
  action?: Partial<SubscriptionExperienceActionConfig>;
  timer?: Partial<SubscriptionExperienceTimerConfig>;
};

export function SubscriptionExperienceDefaultsCard({
  defaults,
  supportWhatsapp,
}: Props) {
  const [draft, setDraft] = useState(defaults);

  const primaryBuckets = useMemo(
    () => subscriptionExperienceBucketDefinitions.filter((item) =>
      item.value === "trial" || item.value === "active",
    ),
    [],
  );
  const advancedBuckets = useMemo(
    () => subscriptionExperienceBucketDefinitions.filter((item) =>
      item.value !== "trial" && item.value !== "active",
    ),
    [],
  );

  const updateBucket = (
    bucket: EditableBucket,
    patch: EditableBucketPatch,
  ) => {
    setDraft((current) => ({
      ...current,
      [bucket]: {
        ...current[bucket],
        ...patch,
        message: {
          ...current[bucket].message,
          ...(patch.message ?? {}),
        },
        action: {
          ...current[bucket].action,
          ...(patch.action ?? {}),
        },
        timer:
          current[bucket].timer || patch.timer
            ? {
                ...(current[bucket].timer ?? { enabled: false }),
                ...(patch.timer ?? {}),
              }
            : undefined,
      },
    }));
  };

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-amber-300/16 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <header className="flex items-start gap-3 border-b border-white/10 p-4 xl:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73]">
          <MessageSquareText className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#f3cf73]">
            Subscription Experience
          </p>
          <h2 className="mt-1 text-xl font-black text-[#fff7e8] lg:text-2xl">
            الإعدادات العامة الافتراضية
          </h2>
          <p className="mt-1 text-sm font-bold leading-6 text-white/45">
            هذا هو المصدر الرسمي لما يظهر داخل لوحة العميل بخصوص الاشتراك والتفعيل
            والفترة التجريبية.
          </p>
        </div>
      </header>

      <form action={saveSubscriptionExperienceDefaultsAction} className="grid gap-4 p-4 xl:p-5">
        {primaryBuckets.map((bucket) => (
          <BucketEditor
            key={bucket.value}
            bucket={bucket.value}
            label={bucket.label}
            description={bucket.description}
            config={draft[bucket.value]}
            onChange={updateBucket}
          />
        ))}

        <section className="rounded-[1.3rem] border border-white/10 bg-black/16 p-4">
          <h3 className="text-base font-black text-[#fff7e8]">
            الفترة التجريبية الافتراضية
          </h3>
          <p className="mt-1 text-xs font-bold leading-6 text-white/42">
            تُحسب من تاريخ إنشاء الحساب الحقيقي للعملاء الجدد. لن تؤثر على العملاء
            الحاليين إلا إذا اخترت ذلك صراحة.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-white/42">
                عدد أيام الفترة التجريبية
              </span>
              <input
                name="trialPolicyDefaultDays"
                type="number"
                min={1}
                max={3650}
                value={draft.trialPolicy.defaultDays}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    trialPolicy: {
                      defaultDays: Number(event.target.value || current.trialPolicy.defaultDays),
                    },
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/60">
              <input name="applyTrialDefaultsToCurrent" type="checkbox" />
              تطبيق المدة الجديدة على العملاء التجريبيين الحاليين
            </label>
          </div>
        </section>

        <details className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/16">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[#fff7e8] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-[#f3cf73]" />
              حالات متقدمة أقل استخدامًا
            </span>
          </summary>
          <div className="grid gap-4 border-t border-white/10 p-4">
            {advancedBuckets.map((bucket) => (
              <BucketEditor
                key={bucket.value}
                bucket={bucket.value}
                label={bucket.label}
                description={bucket.description}
                config={draft[bucket.value]}
                onChange={updateBucket}
              />
            ))}
          </div>
        </details>

        <section className="rounded-[1.3rem] border border-emerald-300/12 bg-emerald-300/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="size-4 text-emerald-300" />
            <h3 className="text-base font-black text-[#fff7e8]">معاينة سريعة</h3>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <PreviewCard
              title="معاينة عميل تجريبي"
              preview={resolveSubscriptionExperience({
                defaults: draft,
                context: {
                  tenantStatus: "TRIAL",
                  subscriptionStatus: "TRIAL",
                  trialEndsAt: new Date("2026-07-20T00:00:00.000Z"),
                  subscriptionEndsAt: new Date("2026-07-20T00:00:00.000Z"),
                  supportWhatsappNumber: supportWhatsapp,
                },
                now: new Date("2026-07-10T00:00:00.000Z"),
              })}
            />
            <PreviewCard
              title="معاينة عميل مشترك"
              preview={resolveSubscriptionExperience({
                defaults: draft,
                context: {
                  tenantStatus: "ACTIVE",
                  subscriptionStatus: "ACTIVE",
                  trialEndsAt: new Date("2026-07-20T00:00:00.000Z"),
                  subscriptionEndsAt: new Date("2026-08-20T00:00:00.000Z"),
                  supportWhatsappNumber: supportWhatsapp,
                },
                now: new Date("2026-07-10T00:00:00.000Z"),
              })}
            />
          </div>
        </section>

        <button className="min-h-12 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5">
          حفظ الإعدادات العامة
        </button>
      </form>
    </section>
  );
}

function BucketEditor({
  bucket,
  label,
  description,
  config,
  onChange,
}: {
  bucket: EditableBucket;
  label: string;
  description: string;
  config: SubscriptionExperienceStateConfig;
  onChange: (
    bucket: EditableBucket,
    patch: EditableBucketPatch,
  ) => void;
}) {
  return (
    <section className="rounded-[1.3rem] border border-white/10 bg-black/16 p-4">
      <div className="mb-4">
        <h3 className="text-base font-black text-[#fff7e8]">{label}</h3>
        <p className="mt-1 text-xs font-bold leading-6 text-white/42">
          {description}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/60">
          <input
            name={`${bucket}MessageEnabled`}
            type="checkbox"
            checked={config.message.enabled}
            onChange={(event) =>
              onChange(bucket, {
                message: { enabled: event.target.checked },
              })
            }
          />
          تشغيل الرسالة
        </label>

        {config.timer ? (
          <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/60">
            <input
              name={`${bucket}TimerEnabled`}
              type="checkbox"
              checked={config.timer.enabled}
              onChange={(event) =>
                onChange(bucket, {
                  timer: { enabled: event.target.checked },
                })
              }
            />
            إظهار المؤقت
          </label>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-xs font-black text-white/35">
            لا يوجد مؤقت لهذه الحالة.
          </div>
        )}

        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-xs font-black text-white/42">عنوان الرسالة</span>
          <input
            name={`${bucket}MessageTitle`}
            value={config.message.title}
            onChange={(event) =>
              onChange(bucket, {
                message: { title: event.target.value },
              })
            }
            className={inputClass}
          />
        </label>

        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-xs font-black text-white/42">وصف الرسالة</span>
          <textarea
            name={`${bucket}MessageDescription`}
            rows={3}
            value={config.message.description}
            onChange={(event) =>
              onChange(bucket, {
                message: { description: event.target.value },
              })
            }
            className={`${inputClass} min-h-[96px] resize-y py-3`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/42">لون الرسالة</span>
          <select
            name={`${bucket}MessageTone`}
            value={config.message.tone}
            onChange={(event) =>
              onChange(bucket, {
                message: { tone: event.target.value as SubscriptionExperienceStateConfig["message"]["tone"] },
              })
            }
            className={inputClass}
          >
            <option value="info">معلومة</option>
            <option value="success">نجاح</option>
            <option value="warning">تنبيه</option>
            <option value="danger">خطر</option>
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/42">نوع الزر</span>
          <select
            name={`${bucket}ActionKind`}
            value={config.action.kind}
            onChange={(event) =>
              onChange(bucket, {
                action: {
                  kind: event.target.value as SubscriptionExperienceActionKind,
                  href:
                    event.target.value === "custom-link"
                      ? config.action.href
                      : null,
                  label:
                    event.target.value === "hidden" ? "" : config.action.label,
                },
              })
            }
            className={inputClass}
          >
            {subscriptionExperienceActionDefinitions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/42">نص الزر</span>
          <input
            name={`${bucket}ActionLabel`}
            value={config.action.label}
            onChange={(event) =>
              onChange(bucket, {
                action: { label: event.target.value },
              })
            }
            disabled={config.action.kind === "hidden"}
            className={`${inputClass} ${config.action.kind === "hidden" ? "opacity-50" : ""}`}
          />
        </label>

        {config.action.kind === "custom-link" ? (
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-black text-white/42">الرابط المخصص</span>
            <input
              name={`${bucket}ActionHref`}
              value={config.action.href ?? ""}
              onChange={(event) =>
                onChange(bucket, {
                  action: { href: event.target.value },
                })
              }
              placeholder="https://example.com/pay"
              className={inputClass}
            />
          </label>
        ) : (
          <input type="hidden" name={`${bucket}ActionHref`} value="" />
        )}
      </div>
    </section>
  );
}

function PreviewCard({
  title,
  preview,
}: {
  title: string;
  preview: ReturnType<typeof resolveSubscriptionExperience>;
}) {
  const toneClass =
    preview.message.tone === "success"
      ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"
      : preview.message.tone === "danger"
        ? "border-red-300/20 bg-red-300/[0.08] text-red-100"
        : preview.message.tone === "info"
          ? "border-sky-300/20 bg-sky-300/[0.08] text-sky-100"
          : "border-amber-300/20 bg-amber-300/[0.08] text-amber-100";

  return (
    <article className={`rounded-3xl border p-4 ${toneClass}`}>
      <p className="mb-3 text-xs font-black opacity-70">{title}</p>
      {preview.message.enabled ? (
        <>
          <h4 className="text-sm font-black">{preview.message.title}</h4>
          <p className="mt-1 text-xs font-bold leading-6 opacity-80">
            {preview.message.description}
          </p>
        </>
      ) : (
        <p className="text-xs font-black opacity-70">الرسالة مخفية</p>
      )}
      {preview.timer.enabled && preview.timer.daysRemaining !== null ? (
        <p className="mt-3 text-xs font-black">
          المؤقت ظاهر — متبقي {preview.timer.daysRemaining} يوم
        </p>
      ) : null}
      {preview.action.visible ? (
        <div className="mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-black/15 px-4 text-xs font-black">
          {preview.action.label}
        </div>
      ) : (
        <p className="mt-3 text-xs font-black opacity-70">لا يوجد زر ظاهر</p>
      )}
    </article>
  );
}
