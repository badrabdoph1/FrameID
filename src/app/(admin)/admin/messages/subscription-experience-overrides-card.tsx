"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  WandSparkles,
  Eye,
  X,
} from "lucide-react";

import {
  resolveSubscriptionExperience,
  getSubscriptionCardVisibilityPreference,
  subscriptionExperienceActionDefinitions,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionExperienceActionKind,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceDefaults,
  type SubscriptionExperienceOverride,
  type SubscriptionExperienceStateOverride,
  type SubscriptionCardVisibilityPreference,
} from "@/modules/subscription/subscription-experience";
import {
  clearSubscriptionExperienceOverrideAction,
  grantFreshTrialFromMessagesAction,
  saveSubscriptionExperienceOverrideAction,
} from "@/app/(admin)/admin/messages/actions";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-[#0b0d12]/80 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

const checkboxLabelClass =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 text-xs font-black text-white/60 transition hover:border-amber-300/20 hover:text-[#f3cf73]";

export type TenantOption = {
  id: string;
  displayName: string;
  owner: { email: string; name: string };
  status: string;
  hasOverride: boolean;
  override?: SubscriptionExperienceOverride | null;
  overrideUpdatedAt?: string | null;
};

type Props = {
  defaults: SubscriptionExperienceDefaults;
  sourceFallbackUsed?: boolean;
  trialTenants: TenantOption[];
  activeTenants: TenantOption[];
  otherTenants: TenantOption[];
};

export function SubscriptionExperienceOverridesCard({
  defaults,
  sourceFallbackUsed = false,
  trialTenants,
  activeTenants,
  otherTenants,
}: Props) {
  const [tab, setTab] = useState<"trial" | "active" | "other">("trial");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bucket, setBucket] = useState<SubscriptionExperienceBucket>("trial");
  const [messageEnabled, setMessageEnabled] = useState(
    defaults.trial.message.enabled,
  );
  const [visibilityPreference, setVisibilityPreference] =
    useState<SubscriptionCardVisibilityPreference>("inherit");
  const [messageTitle, setMessageTitle] = useState(
    defaults.trial.message.title,
  );
  const [messageDescription, setMessageDescription] = useState(
    defaults.trial.message.description,
  );
  const [messageTone, setMessageTone] = useState(defaults.trial.message.tone);
  const [timerEnabled, setTimerEnabled] = useState(
    defaults.trial.timer?.enabled ?? false,
  );
  const [actionKind, setActionKind] =
    useState<SubscriptionExperienceActionKind>(defaults.trial.action.kind);
  const [actionLabel, setActionLabel] = useState(defaults.trial.action.label);
  const [actionHref, setActionHref] = useState(
    defaults.trial.action.href ?? "",
  );
  const [bulkApplyScope, setBulkApplyScope] = useState<"visibility" | "full">(
    "visibility",
  );

  const currentTenants = useMemo(() => {
    const source =
      tab === "trial"
        ? trialTenants
        : tab === "active"
          ? activeTenants
          : otherTenants;

    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((tenant) =>
      `${tenant.displayName} ${tenant.owner.email} ${tenant.owner.name} ${tenant.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [activeTenants, otherTenants, query, tab, trialTenants]);
  const allTenants = useMemo(
    () => [...trialTenants, ...activeTenants, ...otherTenants],
    [activeTenants, otherTenants, trialTenants],
  );
  const selectedTenant = useMemo(() => {
    if (selected.size !== 1) return null;
    return allTenants.find((tenant) => selected.has(tenant.id)) ?? null;
  }, [allTenants, selected]);
  const selectedKey = useMemo(
    () => Array.from(selected).sort().join(","),
    [selected],
  );

  const allSelected =
    currentTenants.length > 0 &&
    currentTenants.every((tenant) => selected.has(tenant.id));

  const toggleSelection = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisibleList = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allSelected) {
        currentTenants.forEach((tenant) => next.delete(tenant.id));
      } else {
        currentTenants.forEach((tenant) => next.add(tenant.id));
      }
      return next;
    });
  };

  const deselectTenant = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const applyBucketPreset = (value: SubscriptionExperienceBucket) => {
    setBucket(value);
    const preset = defaults[value];
    setMessageEnabled(preset.message.enabled);
    setVisibilityPreference("inherit");
    setMessageTitle(preset.message.title);
    setMessageDescription(preset.message.description);
    setMessageTone(preset.message.tone);
    setTimerEnabled(preset.timer?.enabled ?? false);
    setActionKind(preset.action.kind);
    setActionLabel(preset.action.label);
    setActionHref(preset.action.href ?? "");
  };

  useEffect(() => {
    const preset = defaults[bucket];
    if (!selectedTenant) {
      if (selected.size > 1) {
        setBulkApplyScope("visibility");
        setVisibilityPreference("inherit");
        setMessageEnabled(preset.message.enabled);
        setMessageTitle(preset.message.title);
        setMessageDescription(preset.message.description);
        setMessageTone(preset.message.tone);
        setTimerEnabled(preset.timer?.enabled ?? false);
        setActionKind(preset.action.kind);
        setActionLabel(preset.action.label);
        setActionHref(preset.action.href ?? "");
      }
      return;
    }
    const bucketOverride = selectedTenant.override?.[bucket];
    const preference = getSubscriptionCardVisibilityPreference(bucketOverride);
    setVisibilityPreference(preference);
    setMessageEnabled(
      preference === "show"
        ? true
        : preference === "hide"
          ? false
          : preset.message.enabled,
    );
    setMessageTitle(bucketOverride?.message?.title ?? preset.message.title);
    setMessageDescription(
      bucketOverride?.message?.description ?? preset.message.description,
    );
    setMessageTone(bucketOverride?.message?.tone ?? preset.message.tone);
    setTimerEnabled(bucketOverride?.timer?.enabled ?? preset.timer?.enabled ?? false);
    setActionKind(bucketOverride?.action?.kind ?? preset.action.kind);
    setActionLabel(bucketOverride?.action?.label ?? preset.action.label);
    setActionHref(bucketOverride?.action?.href ?? preset.action.href ?? "");
  }, [bucket, defaults, selected.size, selectedKey, selectedTenant]);

  const formIsValid = useMemo(() => {
    if (selected.size === 0) return false;
    if (messageEnabled) {
      if (messageTitle.trim().length < 2) return false;
      if (messageDescription.trim().length < 2) return false;
    }
    if (actionKind === "custom-link" && !actionHref.trim()) return false;
    return true;
  }, [selected, messageEnabled, messageTitle, messageDescription, actionKind, actionHref]);

  const overrideConfig = useMemo<SubscriptionExperienceStateOverride>(() => {
    const bucketConfig = defaults[bucket];
    return {
      message: {
        ...(visibilityPreference === "inherit"
          ? {}
          : { enabled: visibilityPreference === "show" }),
        title: messageEnabled ? messageTitle : bucketConfig.message.title,
        description: messageEnabled ? messageDescription : bucketConfig.message.description,
        tone: messageTone,
      },
      action: {
        kind: actionKind,
        label: actionLabel,
        href: actionKind === "custom-link" ? actionHref : null,
      },
      timer:
        bucket === "trial"
          ? { enabled: timerEnabled }
          : bucketConfig.timer
            ? bucketConfig.timer
            : undefined,
    };
  }, [bucket, messageEnabled, messageTitle, messageDescription, messageTone, actionKind, actionLabel, actionHref, timerEnabled, defaults, visibilityPreference]);

  const previewContext = useMemo(() => {
    const previewTrialEnd = new Date(Date.now() + 14 * 86400000);
    if (bucket === "trial") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: previewTrialEnd,
        subscriptionEndsAt: previewTrialEnd,
        supportWhatsappNumber: "",
      };
    }
    if (bucket === "active") {
      return {
        tenantStatus: "ACTIVE",
        subscriptionStatus: "ACTIVE",
        trialEndsAt: null,
        subscriptionEndsAt: new Date(Date.now() + 60 * 86400000),
        supportWhatsappNumber: "",
      };
    }
    if (bucket === "pendingReview") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: previewTrialEnd,
        subscriptionEndsAt: previewTrialEnd,
        latestPaymentRequestStatus: "UNDER_REVIEW",
        supportWhatsappNumber: "",
      };
    }
    if (bucket === "rejected") {
      return {
        tenantStatus: "TRIAL",
        subscriptionStatus: "TRIAL",
        trialEndsAt: previewTrialEnd,
        subscriptionEndsAt: previewTrialEnd,
        latestPaymentRequestStatus: "REJECTED",
        supportWhatsappNumber: "",
      };
    }
    return {
      tenantStatus: "EXPIRED",
      subscriptionStatus: "EXPIRED",
      trialEndsAt: new Date(Date.now() - 3 * 86400000),
      subscriptionEndsAt: new Date(Date.now() - 3 * 86400000),
      supportWhatsappNumber: "",
    };
  }, [bucket]);

  const preview = resolveSubscriptionExperience({
    defaults,
    override: { [bucket]: overrideConfig },
    context: previewContext,
    now: new Date(),
    sourceFallbackUsed,
  });

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
      <header className="border-b border-white/10 p-4 xl:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73]">
            <WandSparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-[#fff7e8]">
              الاستثناءات الخاصة بالعملاء
            </h2>
            <p className="mt-1 text-sm font-bold leading-6 text-white/45">
              هذه التعديلات تطبق فقط على عملاء محددين تختارهم، ولا تغيّر
              الإعدادات العامة.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 xl:grid-cols-[380px_1fr] xl:p-5">
        <aside className="grid gap-3 content-start">
          <div className="grid gap-1.5 rounded-[1.15rem] border border-white/10 bg-black/16 p-1.5">
            <TabButton
              active={tab === "trial"}
              onClick={() => setTab("trial")}
              title="التجريبيون"
              count={trialTenants.length}
            />
            <TabButton
              active={tab === "active"}
              onClick={() => setTab("active")}
              title="المشتركون"
              count={activeTenants.length}
            />
            <TabButton
              active={tab === "other"}
              onClick={() => setTab("other")}
              title="حالات أخرى"
              count={otherTenants.length}
            />
          </div>

          <div className="rounded-[1.15rem] border border-white/10 bg-black/16 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="size-4 text-[#f3cf73]" />
              <h3 className="text-sm font-black text-[#fff7e8]">
                من سيتأثر بالتعديل؟
              </h3>
            </div>
            <p className="text-xs font-bold leading-6 text-white/42">
              اختر العملاء الذين تريد تطبيق رسالة أو زر مختلف عليهم. التعديل هنا
              لا يغيّر الإعداد العام.
            </p>
          </div>

          <div className="rounded-[1.15rem] border border-amber-300/14 bg-amber-300/[0.05] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-[#f3cf73]" />
              <h3 className="text-sm font-black text-[#fff7e8]">
                منح فترة تجريبية جديدة
              </h3>
            </div>
            <p className="mb-3 text-xs font-bold leading-6 text-white/45">
              فترة تبدأ من لحظة التطبيق بغض النظر عن تاريخ إنشاء الحساب.
            </p>
            <form
              action={grantFreshTrialFromMessagesAction}
              className="grid gap-3"
            >
              {[...selected].map((id) => (
                <input
                  key={`trial-${id}`}
                  type="hidden"
                  name="tenantIds"
                  value={id}
                />
              ))}
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">
                  عدد أيام التجربة الجديدة
                </span>
                <input
                  name="trialDays"
                  type="number"
                  min={1}
                  max={3650}
                  defaultValue={3}
                  className={inputClass}
                />
              </label>
              <button
                disabled={selected.size === 0}
                className="min-h-11 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                منح التجربة الجديدة للمحددِين
              </button>
            </form>
          </div>
        </aside>

        <div className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث داخل العملاء..."
                className={`${inputClass} pr-10`}
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/58 transition hover:border-amber-300/20 hover:text-[#f3cf73]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleVisibleList}
                className="accent-amber-400"
              />
              تحديد كل القائمة
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/12 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-[0.68rem] font-black text-white/35">
              <span>العملاء</span>
              <span>
                {selected.size} محدد · {currentTenants.length} ظاهر
              </span>
            </div>

            {selected.size > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1 px-1">
                {[...selected].map((id) => {
                  const tenant = [...trialTenants, ...activeTenants, ...otherTenants].find(
                    (t) => t.id === id,
                  );
                  if (!tenant) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[0.62rem] font-black text-[#f3cf73]"
                    >
                      {tenant.displayName}
                      <button
                        type="button"
                        onClick={() => deselectTenant(id)}
                        className="grid size-4 place-items-center rounded-md text-[#f3cf73]/60 hover:bg-white/10 hover:text-[#f3cf73]"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}

            <div className="grid max-h-[280px] gap-1.5 overflow-y-auto pr-0.5 admin-scrollbar">
              {currentTenants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-white/35">
                  لا يوجد عملاء مطابقون.
                </div>
              ) : (
                currentTenants.map((tenant) => (
                  <label
                    key={tenant.id}
                    className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2.5 transition hover:border-amber-300/20 hover:bg-amber-300/8"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(tenant.id)}
                      onChange={() => toggleSelection(tenant.id)}
                      className="mt-2 accent-amber-400"
                    />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-black text-[#fff7e8]">
                        {tenant.displayName}
                        {tenant.hasOverride ? (
                          <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[0.58rem] font-black text-[#f3cf73]">
                            Override
                          </span>
                        ) : null}
                      </strong>
                      <small className="mt-0.5 block truncate text-xs font-bold text-white/40">
                        {tenant.owner.email}
                      </small>
                      <small className="mt-1 block text-[0.62rem] font-black text-white/45">
                        {tenant.status}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <form
            action={saveSubscriptionExperienceOverrideAction}
            className="grid gap-4 rounded-[1.15rem] border border-white/10 bg-black/16 p-4"
          >
            {[...selected].map((id) => (
              <input
                key={`override-${id}`}
                type="hidden"
                name="tenantIds"
                value={id}
              />
            ))}
            <input type="hidden" name="bucket" value={bucket} />
            <input type="hidden" name="messageEnabled" value={messageEnabled ? "true" : "false"} />
            <input
              type="hidden"
              name="applyScope"
              value={selected.size > 1 ? bulkApplyScope : "full"}
            />

            <label className="grid gap-1.5">
              <span className="text-xs font-black text-white/42">
                اختر الحالة التي تريد تخصيصها
              </span>
              <select
                value={bucket}
                onChange={(event) =>
                  applyBucketPreset(
                    event.target.value as SubscriptionExperienceBucket,
                  )
                }
                className={inputClass}
              >
                {subscriptionExperienceBucketDefinitions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">قرار ظهور الكارت</span>
                <select
                  aria-label="قرار ظهور الكارت"
                  name="visibilityPreference"
                  value={visibilityPreference}
                  onChange={(event) => {
                    const preference = event.target.value as SubscriptionCardVisibilityPreference;
                    setVisibilityPreference(preference);
                    setMessageEnabled(
                      preference === "show"
                        ? true
                        : preference === "hide"
                          ? false
                          : defaults[bucket].message.enabled,
                    );
                  }}
                  className={inputClass}
                >
                  <option value="inherit">يتبع الإعداد العام</option>
                  <option value="show">إظهار لهذا العميل</option>
                  <option value="hide">إخفاء لهذا العميل</option>
                </select>
              </label>

              {bucket === "trial" ? (
                <label className={checkboxLabelClass}>
                  <input
                    name="timerEnabled"
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(event) =>
                      setTimerEnabled(event.target.checked)
                    }
                    className="accent-amber-400"
                  />
                  <span>إظهار المؤقت لهذا الاستثناء</span>
                </label>
              ) : (
                <input type="hidden" name="timerEnabled" value="false" />
              )}
            </div>

            {selected.size > 1 ? (
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">نطاق التطبيق الجماعي</span>
                <select
                  aria-label="نطاق التطبيق الجماعي"
                  value={bulkApplyScope}
                  onChange={(event) =>
                    setBulkApplyScope(event.target.value as "visibility" | "full")
                  }
                  className={inputClass}
                >
                  <option value="visibility">تطبيق قرار الظهور فقط — يحافظ على محتوى كل عميل</option>
                  <option value="full">تطبيق الرسالة والزر والظهور كاملًا على الجميع</option>
                </select>
              </label>
            ) : null}

            {selectedTenant?.override?.[bucket] ? (
              <p className="text-[0.68rem] font-bold text-white/38">
                آخر تعديل بواسطة {selectedTenant.override[bucket]?.metadata?.updatedByAdminName ?? "تعديل سابق"}
                {selectedTenant.override[bucket]?.metadata?.updatedAt || selectedTenant.overrideUpdatedAt
                  ? ` · ${new Date(selectedTenant.override[bucket]?.metadata?.updatedAt ?? selectedTenant.overrideUpdatedAt ?? "").toLocaleString("ar-EG")}`
                  : ""}
              </p>
            ) : null}

            {messageEnabled ? (
              <>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">
                    عنوان الرسالة
                  </span>
                  <input
                    name="messageTitle"
                    value={messageTitle}
                    onChange={(event) =>
                      setMessageTitle(event.target.value)
                    }
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">
                    وصف الرسالة
                  </span>
                  <textarea
                    name="messageDescription"
                    rows={3}
                    value={messageDescription}
                    onChange={(event) =>
                      setMessageDescription(event.target.value)
                    }
                    className={`${inputClass} min-h-[88px] resize-y py-3`}
                  />
                </label>
              </>
            ) : (
              <>
                <input type="hidden" name="messageTitle" value={messageTitle} />
                <input type="hidden" name="messageDescription" value={messageDescription} />
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-center text-xs font-bold text-white/35">
                  الرسالة معطلة — لن يظهر عنوان ولا وصف للعميل، لكن محتواهما سيظل محفوظًا.
                </div>
              </>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">
                  لون الرسالة
                </span>
                <select
                  name="messageTone"
                  value={messageTone}
                  onChange={(event) =>
                    setMessageTone(event.target.value as typeof messageTone)
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
                <span className="text-xs font-black text-white/42">
                  نوع الزر
                </span>
                <select
                  name="actionKind"
                  value={actionKind}
                  onChange={(event) =>
                    setActionKind(
                      event.target.value as SubscriptionExperienceActionKind,
                    )
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
                  name="actionLabel"
                  value={actionLabel}
                  onChange={(event) => setActionLabel(event.target.value)}
                  disabled={actionKind === "hidden"}
                  className={`${inputClass} ${
                    actionKind === "hidden" ? "opacity-50" : ""
                  }`}
                />
              </label>

              {actionKind === "custom-link" ? (
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">
                    الرابط المخصص
                  </span>
                  <input
                    name="actionHref"
                    value={actionHref}
                    onChange={(event) => setActionHref(event.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </label>
              ) : (
                <input type="hidden" name="actionHref" value="" />
              )}
            </div>

            <div className="rounded-[1.15rem] border border-emerald-300/10 bg-emerald-300/[0.04] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Eye className="size-3.5 text-emerald-300" />
                <span className="text-[0.68rem] font-black text-[#fff7e8]">
                  معاينة سريعة
                </span>
              </div>
              <p className="mb-2 text-[0.68rem] font-black text-white/48">
                النتيجة: {preview.visibility.effective === "visible" ? "ظاهر" : "مخفي"} · المصدر: {preview.visibility.source === "customer-override" ? "استثناء العميل" : preview.visibility.source === "system-fallback" ? "إعداد النظام الاحتياطي" : "الإعداد العام"}
              </p>
              <InlineOverridePreview preview={preview} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!formIsValid}
                className="min-h-11 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                حفظ الاستثناء لـ {selected.size} عميل
              </button>
              <button
                type="submit"
                formAction={clearSubscriptionExperienceOverrideAction}
                disabled={selected.size === 0}
                className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/72 transition hover:border-red-300/25 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                إزالة الاستثناء عن المحددِين
              </button>
              <button
                type="button"
                onClick={() => applyBucketPreset(bucket)}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.06]"
              >
                <RotateCcw className="size-4" />
                إعادة ضبط من الإعداد العام
              </button>
            </div>
            {!formIsValid ? (
              <p className="text-center text-[0.68rem] font-bold text-red-300/80">
                اختر عميلًا واحدًا على الأقل وأكمل الحقول المطلوبة.
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  title,
  count,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-amber-300/28 bg-amber-300/12 px-3 text-sm font-black text-[#f3cf73]"
          : "flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-transparent px-3 text-sm font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"
      }
    >
      <span>{title}</span>
      <span className="rounded-full bg-black/18 px-2 py-0.5 text-xs font-black">
        {count}
      </span>
    </button>
  );
}

function InlineOverridePreview({
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

  const hasAnything =
    preview.message.enabled ||
    preview.timer.enabled ||
    preview.action.visible;

  if (!hasAnything) {
    return (
      <div
        className={`rounded-xl border p-3 text-center text-[0.62rem] font-bold text-white/28 ${toneClass}`}
      >
        لن يظهر شيء للعميل.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-2.5 ${toneClass}`}>
      {preview.message.enabled ? (
        <>
          <p className="text-[0.68rem] font-black text-[#fff7e8]">
            {preview.message.title}
          </p>
          <p className="mt-0.5 text-[0.58rem] font-bold leading-4 text-white/55">
            {preview.message.description}
          </p>
        </>
      ) : (
        <p className="text-[0.6rem] font-bold text-white/28">الرسالة مخفية</p>
      )}

      {preview.timer.enabled && preview.timer.daysRemaining !== null ? (
        <p className="mt-1.5 text-[0.58rem] font-black text-white/40">
          متبقي {preview.timer.daysRemaining} يوم
        </p>
      ) : null}

      {preview.action.visible && preview.action.href ? (
        <div className="mt-2 inline-flex min-h-7 items-center justify-center rounded-lg border border-white/10 bg-black/20 px-3 text-[0.6rem] font-black text-[#fff7e8]">
          {preview.action.label}
        </div>
      ) : null}
    </div>
  );
}
