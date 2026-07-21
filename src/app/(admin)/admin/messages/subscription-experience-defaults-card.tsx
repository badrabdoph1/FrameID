"use client";

import { useMemo, useState, useRef } from "react";
import {
  Eye,
  MessageSquareText,
  Navigation,
  Timer,
  ToggleLeft,
} from "lucide-react";

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

const checkboxLabelClass =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 text-xs font-black text-white/60 transition hover:border-amber-300/20 hover:text-[#f3cf73]";

const sectionCardClass =
  "rounded-[1.2rem] border border-white/10 bg-black/16 p-4";

type Props = {
  defaults: SubscriptionExperienceDefaults;
  supportWhatsapp: string;
};

export function SubscriptionExperienceDefaultsCard({
  defaults,
  supportWhatsapp,
}: Props) {
  const [draft, setDraft] = useState(defaults);
  const [activeBucket, setActiveBucket] =
    useState<SubscriptionExperienceBucket>("trial");
  const formRef = useRef<HTMLFormElement>(null);

  const bucketDefs = useMemo(
    () => subscriptionExperienceBucketDefinitions,
    [],
  );
  const activeDef = bucketDefs.find((d) => d.value === activeBucket)!;
  const activeConfig = draft[activeBucket];

  const previewContext = useMemo(() => {
    const now = new Date();
    const future = new Date(now.getTime() + 14 * 86400000);
    if (activeBucket === "trial") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: future,
        subscriptionEndsAt: future,
        supportWhatsappNumber: supportWhatsapp,
      };
    }
    if (activeBucket === "active") {
      return {
        tenantStatus: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        trialEndsAt: null,
        subscriptionEndsAt: new Date(now.getTime() + 60 * 86400000),
        supportWhatsappNumber: supportWhatsapp,
      };
    }
    if (activeBucket === "pendingReview") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: future,
        subscriptionEndsAt: future,
        latestPaymentRequestStatus: "UNDER_REVIEW",
        supportWhatsappNumber: supportWhatsapp,
      };
    }
    if (activeBucket === "rejected") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: future,
        subscriptionEndsAt: future,
        latestPaymentRequestStatus: "REJECTED",
        supportWhatsappNumber: supportWhatsapp,
      };
    }
    return {
      tenantStatus: "EXPIRED",
      subscriptionStatus: "EXPIRED",
      trialEndsAt: new Date(now.getTime() - 3 * 86400000),
      subscriptionEndsAt: new Date(now.getTime() - 3 * 86400000),
      supportWhatsappNumber: supportWhatsapp,
    };
  }, [activeBucket, supportWhatsapp]);

  const preview = resolveSubscriptionExperience({
    defaults: draft,
    context: previewContext,
    now: new Date(),
  });

  const updateBucket = (patch: {
    message?: Partial<SubscriptionExperienceMessage>;
    action?: Partial<SubscriptionExperienceActionConfig>;
    timer?: Partial<SubscriptionExperienceTimerConfig>;
  }) => {
    setDraft((current) => ({
      ...current,
      [activeBucket]: {
        ...current[activeBucket],
        ...patch,
        message: {
          ...current[activeBucket].message,
          ...(patch.message ?? {}),
        },
        action: {
          ...current[activeBucket].action,
          ...(patch.action ?? {}),
        },
        timer:
          current[activeBucket].timer ?? patch.timer
            ? {
                ...(current[activeBucket].timer ?? { enabled: false }),
                ...(patch.timer ?? {}),
              }
            : undefined,
      },
    }));
  };

  const formIsValid = useMemo(() => {
    for (const bucket of subscriptionExperienceBucketDefinitions) {
      const config = draft[bucket.value];
      if (config.message.enabled) {
        if (config.message.title.trim().length < 2) return false;
        if (config.message.description.trim().length < 2) return false;
      }
      if (
        config.action.kind === "custom-link" &&
        (!config.action.href || !config.action.href.trim())
      ) {
        return false;
      }
    }
    return true;
  }, [draft]);

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-amber-300/16 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <header className="flex items-start gap-3 border-b border-white/10 p-4 xl:p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73]">
          <MessageSquareText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
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

      <nav
        role="tablist"
        aria-label="حالات الاشتراك"
        className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 pt-4 xl:px-5"
      >
        {bucketDefs.map((def) => {
          const isActive = activeBucket === def.value;
          const config = draft[def.value];
          return (
            <button
              key={def.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveBucket(def.value)}
              className={
                isActive
                  ? "flex shrink-0 items-center gap-2 rounded-t-2xl border border-b-0 border-amber-300/28 bg-[#0b0d12] px-4 py-3 text-sm font-black text-[#f3cf73]"
                  : "flex shrink-0 items-center gap-2 rounded-t-2xl border border-transparent px-4 py-3 text-sm font-bold text-white/42 transition hover:text-white/70"
              }
            >
              <span
                className={
                  config.message.enabled
                    ? "size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(110,231,183,0.6)]"
                    : "size-1.5 rounded-full bg-white/20"
                }
              />
              {def.label}
            </button>
          );
        })}
      </nav>

      <form ref={formRef} action={saveSubscriptionExperienceDefaultsAction}>
        <div className="grid gap-6 p-4 xl:grid-cols-[1fr_340px] xl:p-5">
          <div className="grid gap-4">
            <div className="mb-1">
              <h3 className="text-lg font-black text-[#fff7e8]">
                {activeDef.label}
              </h3>
              <p className="mt-0.5 text-xs font-bold leading-6 text-white/45">
                {activeDef.description}
              </p>
            </div>

            <section className={sectionCardClass}>
              <div className="mb-3 flex items-center gap-2">
                <ToggleLeft className="size-4 text-[#f3cf73]" />
                <h4 className="text-sm font-black text-[#fff7e8]">
                  إعدادات الرسالة
                </h4>
              </div>
              <div className="grid gap-3">
                <label className={checkboxLabelClass}>
                  <input
                    name={`${activeBucket}MessageEnabled`}
                    type="checkbox"
                    checked={activeConfig.message.enabled}
                    onChange={(event) =>
                      updateBucket({ message: { enabled: event.target.checked } })
                    }
                    className="accent-amber-400"
                  />
                  <span>تشغيل الرسالة في لوحة تحكم العميل</span>
                </label>

                {activeConfig.message.enabled ? (
                  <>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">
                        عنوان الرسالة
                      </span>
                      <input
                        name={`${activeBucket}MessageTitle`}
                        value={activeConfig.message.title}
                        onChange={(event) =>
                          updateBucket({
                            message: { title: event.target.value },
                          })
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">
                        وصف الرسالة
                      </span>
                      <textarea
                        name={`${activeBucket}MessageDescription`}
                        rows={3}
                        value={activeConfig.message.description}
                        onChange={(event) =>
                          updateBucket({
                            message: { description: event.target.value },
                          })
                        }
                        className={`${inputClass} min-h-[88px] resize-y py-3`}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">
                        لون الرسالة
                      </span>
                      <select
                        name={`${activeBucket}MessageTone`}
                        value={activeConfig.message.tone}
                        onChange={(event) =>
                          updateBucket({
                            message: {
                              tone: event.target
                                .value as SubscriptionExperienceStateConfig["message"]["tone"],
                            },
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
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-center text-xs font-bold text-white/35">
                    الرسالة معطلة — لن يظهر عنوان ولا وصف للعميل في هذه الحالة.
                  </div>
                )}
              </div>
            </section>

            {activeConfig.timer ? (
              <section className={sectionCardClass}>
                <div className="mb-3 flex items-center gap-2">
                  <Timer className="size-4 text-[#f3cf73]" />
                  <h4 className="text-sm font-black text-[#fff7e8]">
                    المؤقت الزمني
                  </h4>
                </div>
                <label className={checkboxLabelClass}>
                  <input
                    name={`${activeBucket}TimerEnabled`}
                    type="checkbox"
                    checked={activeConfig.timer.enabled}
                    onChange={(event) =>
                      updateBucket({
                        timer: { enabled: event.target.checked },
                      })
                    }
                    className="accent-amber-400"
                  />
                  <span>إظهار عدد الأيام المتبقية للعميل</span>
                </label>
                {!activeConfig.timer.enabled ? (
                  <p className="mt-3 text-xs font-bold text-white/35">
                    المؤقت مخفي — لن يرى العميل عدد الأيام المتبقية.
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className={sectionCardClass}>
              <div className="mb-3 flex items-center gap-2">
                <Navigation className="size-4 text-[#f3cf73]" />
                <h4 className="text-sm font-black text-[#fff7e8]">
                  زر الإجراء
                </h4>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">
                    نوع الزر
                  </span>
                  <select
                    name={`${activeBucket}ActionKind`}
                    value={activeConfig.action.kind}
                    onChange={(event) =>
                      updateBucket({
                        action: {
                          kind: event.target
                            .value as SubscriptionExperienceActionKind,
                          href:
                            event.target.value === "custom-link"
                              ? activeConfig.action.href
                              : null,
                          label:
                            event.target.value === "hidden"
                              ? ""
                              : activeConfig.action.label,
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
                  <span className="text-xs font-black text-white/42">
                    نص الزر
                  </span>
                  <input
                    name={`${activeBucket}ActionLabel`}
                    value={activeConfig.action.label}
                    onChange={(event) =>
                      updateBucket({
                        action: { label: event.target.value },
                      })
                    }
                    disabled={activeConfig.action.kind === "hidden"}
                    className={`${inputClass} ${
                      activeConfig.action.kind === "hidden" ? "opacity-50" : ""
                    }`}
                  />
                </label>

                {activeConfig.action.kind === "custom-link" ? (
                  <label className="grid gap-1.5 lg:col-span-2">
                    <span className="text-xs font-black text-white/42">
                      الرابط المخصص
                    </span>
                    <input
                      name={`${activeBucket}ActionHref`}
                      value={activeConfig.action.href ?? ""}
                      onChange={(event) =>
                        updateBucket({
                          action: { href: event.target.value },
                        })
                      }
                      placeholder="https://example.com/pay"
                      className={inputClass}
                    />
                  </label>
                ) : (
                  <input
                    type="hidden"
                    name={`${activeBucket}ActionHref`}
                    value=""
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="grid gap-4 content-start">
            <section className={sectionCardClass}>
              <div className="mb-3 flex items-center gap-2">
                <Eye className="size-4 text-emerald-300" />
                <h4 className="text-sm font-black text-[#fff7e8]">
                  معاينة مباشرة
                </h4>
              </div>
              <InlinePreview preview={preview} />
            </section>

            <button
              type="submit"
              disabled={!formIsValid}
              className="min-h-12 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              حفظ الإعدادات العامة
            </button>
            {!formIsValid ? (
              <p className="text-center text-[0.68rem] font-bold text-red-300/80">
                أكمل الحقول المطلوبة قبل الحفظ.
              </p>
            ) : null}
          </aside>
        </div>

        {bucketDefs
          .filter((def) => def.value !== activeBucket)
          .map((def) => {
            const config = draft[def.value];
            return (
              <span key={def.value}>
                <input
                  type="hidden"
                  name={`${def.value}MessageEnabled`}
                  value={config.message.enabled ? "on" : ""}
                />
                <input
                  type="hidden"
                  name={`${def.value}MessageTitle`}
                  value={config.message.title}
                />
                <input
                  type="hidden"
                  name={`${def.value}MessageDescription`}
                  value={config.message.description}
                />
                <input
                  type="hidden"
                  name={`${def.value}MessageTone`}
                  value={config.message.tone}
                />
                <input
                  type="hidden"
                  name={`${def.value}ActionKind`}
                  value={config.action.kind}
                />
                <input
                  type="hidden"
                  name={`${def.value}ActionLabel`}
                  value={config.action.label}
                />
                <input
                  type="hidden"
                  name={`${def.value}ActionHref`}
                  value={config.action.href ?? ""}
                />
                {config.timer ? (
                  <input
                    type="hidden"
                    name={`${def.value}TimerEnabled`}
                    value={config.timer.enabled ? "on" : ""}
                  />
                ) : null}
              </span>
            );
          })}
      </form>
    </section>
  );
}

function InlinePreview({
  preview,
}: {
  preview: ReturnType<typeof resolveSubscriptionExperience>;
}) {
  const toneClass =
    preview.message.tone === "success"
      ? "border-emerald-300/20 bg-emerald-300/[0.06]"
      : preview.message.tone === "danger"
        ? "border-red-300/20 bg-red-300/[0.06]"
        : preview.message.tone === "info"
          ? "border-sky-300/20 bg-sky-300/[0.06]"
          : "border-amber-300/20 bg-amber-300/[0.06]";

  const toneAccent =
    preview.message.tone === "success"
      ? "text-emerald-300"
      : preview.message.tone === "danger"
        ? "text-red-300"
        : preview.message.tone === "info"
          ? "text-sky-300"
          : "text-[#f3cf73]";

  const toneBg =
    preview.message.tone === "success"
      ? "bg-emerald-400"
      : preview.message.tone === "danger"
        ? "bg-red-400"
        : preview.message.tone === "info"
          ? "bg-sky-400"
          : "bg-amber-400";

  const hasAnything =
    preview.message.enabled ||
    preview.timer.enabled ||
    preview.action.visible;

  if (!hasAnything) {
    return (
      <div
        className={`rounded-2xl border p-4 text-center text-xs font-bold text-white/30 ${toneClass}`}
      >
        لن يظهر شيء للعميل في هذه الحالة.
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`size-1.5 shrink-0 rounded-full ${toneBg} shadow-[0_0_8px_currentColor]`}
          style={{ color: `var(--tw-ring-color)` }}
        />
        <span className={`text-[0.62rem] font-black ${toneAccent}`}>
          كيف يرى العميل هذه الحالة
        </span>
      </div>

      {preview.message.enabled ? (
        <>
          <p className="text-[0.72rem] font-black text-[#fff7e8]">
            {preview.message.title}
          </p>
          <p className="mt-1 text-[0.62rem] font-bold leading-5 text-white/60">
            {preview.message.description}
          </p>
        </>
      ) : (
        <p className="text-[0.65rem] font-bold text-white/28">
          الرسالة مخفية
        </p>
      )}

      {preview.timer.enabled && preview.timer.daysRemaining !== null ? (
        <p className="mt-2 text-[0.62rem] font-black text-white/45">
          ⏱ متبقي {preview.timer.daysRemaining} يوم
        </p>
      ) : null}

      {preview.action.visible && preview.action.href ? (
        <div className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 px-3.5 text-[0.68rem] font-black text-[#fff7e8]">
          {preview.action.label}
        </div>
      ) : null}
    </div>
  );
}
