"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  RotateCcw,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import {
  subscriptionExperienceActionDefinitions,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionExperienceActionKind,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceDefaults,
} from "@/modules/subscription/subscription-experience";
import {
  clearSubscriptionExperienceOverrideAction,
  grantFreshTrialFromMessagesAction,
  saveSubscriptionExperienceOverrideAction,
} from "@/app/(admin)/admin/messages/actions";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-[#0b0d12]/80 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

type TenantOption = {
  id: string;
  displayName: string;
  owner: { email: string; name: string };
  status: string;
  hasOverride: boolean;
};

type Props = {
  defaults: SubscriptionExperienceDefaults;
  trialTenants: TenantOption[];
  activeTenants: TenantOption[];
  otherTenants: TenantOption[];
};

export function SubscriptionExperienceOverridesCard({
  defaults,
  trialTenants,
  activeTenants,
  otherTenants,
}: Props) {
  const [tab, setTab] = useState<"trial" | "active" | "other">("trial");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bucket, setBucket] = useState<SubscriptionExperienceBucket>("trial");
  const [messageEnabled, setMessageEnabled] = useState(true);
  const [messageTitle, setMessageTitle] = useState(defaults.trial.message.title);
  const [messageDescription, setMessageDescription] = useState(defaults.trial.message.description);
  const [messageTone, setMessageTone] = useState(defaults.trial.message.tone);
  const [timerEnabled, setTimerEnabled] = useState(defaults.trial.timer?.enabled ?? false);
  const [actionKind, setActionKind] = useState<SubscriptionExperienceActionKind>(defaults.trial.action.kind);
  const [actionLabel, setActionLabel] = useState(defaults.trial.action.label);
  const [actionHref, setActionHref] = useState(defaults.trial.action.href ?? "");

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
      if (allSelected) currentTenants.forEach((tenant) => next.delete(tenant.id));
      else currentTenants.forEach((tenant) => next.add(tenant.id));
      return next;
    });
  };

  const applyBucketPreset = (value: SubscriptionExperienceBucket) => {
    setBucket(value);
    const preset = defaults[value];
    setMessageEnabled(preset.message.enabled);
    setMessageTitle(preset.message.title);
    setMessageDescription(preset.message.description);
    setMessageTone(preset.message.tone);
    setTimerEnabled(preset.timer?.enabled ?? false);
    setActionKind(preset.action.kind);
    setActionLabel(preset.action.label);
    setActionHref(preset.action.href ?? "");
  };

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
      <header className="border-b border-white/10 p-4 xl:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73]">
            <WandSparkles className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#fff7e8]">
              الاستثناءات الخاصة بالعملاء
            </h2>
            <p className="mt-1 text-sm font-bold leading-6 text-white/45">
              هذه التعديلات لا تغيّر الإعدادات العامة. هي Overrides للعملاء
              الذين تختارهم فقط.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 xl:grid-cols-[360px_1fr] xl:p-5">
        <aside className="grid gap-3 content-start">
          <div className="grid gap-2 rounded-[1.15rem] border border-white/10 bg-black/16 p-1.5">
            <TabButton active={tab === "trial"} onClick={() => setTab("trial")} title="التجريبيون" count={trialTenants.length} />
            <TabButton active={tab === "active"} onClick={() => setTab("active")} title="المشتركون" count={activeTenants.length} />
            <TabButton active={tab === "other"} onClick={() => setTab("other")} title="عملاء آخرون" count={otherTenants.length} />
          </div>

          <div className="rounded-[1.15rem] border border-white/10 bg-black/16 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="size-4 text-[#f3cf73]" />
              <h3 className="text-sm font-black text-[#fff7e8]">من سيتأثر؟</h3>
            </div>
            <p className="text-xs font-bold leading-6 text-white/42">
              التعديل هنا خاص بالعملاء المحددين فقط. يمكنك تحديد مجموعة من
              العملاء ثم تطبيق رسالة أو زر مختلف عليهم.
            </p>
          </div>

          <div className="rounded-[1.15rem] border border-amber-300/14 bg-amber-300/[0.05] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-[#f3cf73]" />
              <h3 className="text-sm font-black text-[#fff7e8]">Trial مستقلة جديدة</h3>
            </div>
            <p className="mb-3 text-xs font-bold leading-6 text-white/45">
              هذا الإجراء يبدأ من لحظة التطبيق، ولا يعتمد على تاريخ إنشاء الحساب.
            </p>
            <form action={grantFreshTrialFromMessagesAction} className="grid gap-3">
              {[...selected].map((id) => (
                <input key={`trial-${id}`} type="hidden" name="tenantIds" value={id} />
              ))}
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">عدد أيام Trial الجديدة</span>
                <input name="trialDays" type="number" min={1} max={3650} defaultValue={3} className={inputClass} />
              </label>
              <button className="min-h-11 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a]">
                منح Trial جديدة للمحددِين
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
            <label className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/58">
              <input type="checkbox" checked={allSelected} onChange={toggleVisibleList} />
              تحديد القائمة الحالية
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/12 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-[0.68rem] font-black text-white/35">
              <span>العملاء</span>
              <span>{selected.size} محدد · {currentTenants.length} ظاهر</span>
            </div>
            <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 admin-scrollbar">
              {currentTenants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-white/35">
                  لا يوجد عملاء مطابقون.
                </div>
              ) : (
                currentTenants.map((tenant) => (
                  <label
                    key={tenant.id}
                    className="grid cursor-pointer grid-cols-[auto,1fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 transition hover:border-amber-300/20 hover:bg-amber-300/8"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(tenant.id)}
                      onChange={() => toggleSelection(tenant.id)}
                      className="mt-2"
                    />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-black text-[#fff7e8]">
                        {tenant.displayName}
                      </strong>
                      <small className="mt-0.5 block truncate text-xs font-bold text-white/40">
                        {tenant.owner.email}
                      </small>
                      <small className="mt-1 block text-[0.68rem] font-black text-white/45">
                        {tenant.status}
                        {tenant.hasOverride ? " · لديه Override" : ""}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <form action={saveSubscriptionExperienceOverrideAction} className="grid gap-4 rounded-[1.3rem] border border-white/10 bg-black/16 p-4">
            {[...selected].map((id) => (
              <input key={`override-${id}`} type="hidden" name="tenantIds" value={id} />
            ))}
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">نوع الرسالة التي تريد تخصيصها</span>
                <select
                  name="bucket"
                  value={bucket}
                  onChange={(event) => applyBucketPreset(event.target.value as SubscriptionExperienceBucket)}
                  className={inputClass}
                >
                  {subscriptionExperienceBucketDefinitions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 text-xs font-bold leading-6 text-white/48">
                سيتم حفظ هذا التخصيص على العملاء المحددين فقط، ولن يغيّر أي إعداد
                عام في النظام.
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/60">
                <input
                  name="messageEnabled"
                  type="checkbox"
                  checked={messageEnabled}
                  onChange={(event) => setMessageEnabled(event.target.checked)}
                />
                تشغيل الرسالة لهذا الاستثناء
              </label>

              {bucket === "trial" ? (
                <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/60">
                  <input
                    name="timerEnabled"
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(event) => setTimerEnabled(event.target.checked)}
                  />
                  إظهار المؤقت لهذا الاستثناء
                </label>
              ) : (
                <input type="hidden" name="timerEnabled" value="false" />
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5 lg:col-span-2">
                <span className="text-xs font-black text-white/42">عنوان الرسالة</span>
                <input
                  name="messageTitle"
                  value={messageTitle}
                  onChange={(event) => setMessageTitle(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="grid gap-1.5 lg:col-span-2">
                <span className="text-xs font-black text-white/42">وصف الرسالة</span>
                <textarea
                  name="messageDescription"
                  rows={3}
                  value={messageDescription}
                  onChange={(event) => setMessageDescription(event.target.value)}
                  className={`${inputClass} min-h-[96px] resize-y py-3`}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">لون الرسالة</span>
                <select
                  name="messageTone"
                  value={messageTone}
                  onChange={(event) => setMessageTone(event.target.value as typeof messageTone)}
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
                  name="actionKind"
                  value={actionKind}
                  onChange={(event) => setActionKind(event.target.value as SubscriptionExperienceActionKind)}
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
                  name="actionLabel"
                  value={actionLabel}
                  onChange={(event) => setActionLabel(event.target.value)}
                  disabled={actionKind === "hidden"}
                  className={`${inputClass} ${actionKind === "hidden" ? "opacity-50" : ""}`}
                />
              </label>

              {actionKind === "custom-link" ? (
                <label className="grid gap-1.5 lg:col-span-2">
                  <span className="text-xs font-black text-white/42">الرابط المخصص</span>
                  <input
                    name="actionHref"
                    value={actionHref}
                    onChange={(event) => setActionHref(event.target.value)}
                    className={inputClass}
                  />
                </label>
              ) : (
                <input type="hidden" name="actionHref" value="" />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="min-h-11 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a]">
                حفظ Override للمحددِين
              </button>
              <button
                type="submit"
                formAction={clearSubscriptionExperienceOverrideAction}
                className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/72 transition hover:border-red-300/25 hover:text-red-200"
              >
                إزالة Override عن المحددِين
              </button>
              <button
                type="button"
                onClick={() => applyBucketPreset(bucket)}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-white/70"
              >
                <RotateCcw className="size-4" />
                إعادة ملء الحقول من الإعداد العام
              </button>
            </div>
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
          ? "flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-amber-300/28 bg-amber-300/12 px-3 text-sm font-black text-[#f3cf73]"
          : "flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-transparent px-3 text-sm font-black text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"
      }
    >
      <span>{title}</span>
      <span className="rounded-full bg-black/18 px-2 py-0.5 text-xs">{count}</span>
    </button>
  );
}
