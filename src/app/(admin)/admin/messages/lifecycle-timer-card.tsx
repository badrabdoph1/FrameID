"use client";

import { useMemo, useState } from "react";
import { Clock3, Search, TimerReset, Users } from "lucide-react";

import { applyLifecycleTimerAction, saveLifecycleTimersAction } from "@/app/(admin)/admin/messages/actions";
import { lifecycleDurationOptions, type LifecycleTimerSettings } from "@/modules/lifecycle/customer-lifecycle";

type TenantOption = {
  id: string;
  displayName: string;
  status: string;
  owner: { email: string; name: string };
};

type Props = {
  settings: LifecycleTimerSettings;
  trialTenants: TenantOption[];
  activeTenants: TenantOption[];
};

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

function filterTenants(tenants: TenantOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return tenants;
  return tenants.filter((tenant) => `${tenant.displayName} ${tenant.owner.email} ${tenant.owner.name}`.toLowerCase().includes(q));
}

export function LifecycleTimerCard({ settings, trialTenants, activeTenants }: Props) {
  const [trialQuery, setTrialQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [trialSelection, setTrialSelection] = useState<Set<string>>(new Set());
  const [activeSelection, setActiveSelection] = useState<Set<string>>(new Set());

  const filteredTrial = useMemo(() => filterTenants(trialTenants, trialQuery), [trialTenants, trialQuery]);
  const filteredActive = useMemo(() => filterTenants(activeTenants, activeQuery), [activeTenants, activeQuery]);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_34%),rgba(255,255,255,0.035)] shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
      <header className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><Clock3 className="size-5" /></span>
          <div>
            <p className="text-xs font-black text-[#f3cf73]">Customer Lifecycle</p>
            <h2 className="text-xl font-black text-[#fff7e8]">مؤقت لوحة التحكم</h2>
            <p className="mt-1 text-sm font-bold leading-6 text-white/50">إدارة مؤقت التجربة والاشتراك وتطبيقهما على كل العملاء أو على عملاء محددين.</p>
          </div>
        </div>
        <form action={saveLifecycleTimersAction} className="grid gap-2 rounded-2xl border border-white/10 bg-black/16 p-3 lg:min-w-[420px]">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/60">
              <input name="trialEnabled" type="checkbox" defaultChecked={settings.trial.enabled} /> تشغيل التجربة
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-xs font-black text-white/60">
              <input name="subscriptionEnabled" type="checkbox" defaultChecked={settings.subscription.enabled} /> تشغيل الاشتراك
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input name="trialDays" type="number" min={1} max={3650} defaultValue={settings.trial.defaultDays} className={inputClass} placeholder="أيام التجربة" />
            <select name="subscriptionPreset" defaultValue={settings.subscription.defaultPreset} className={inputClass}>
              {lifecycleDurationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input name="subscriptionCustomDays" type="number" min={1} max={3650} defaultValue={settings.subscription.customDays} className={inputClass} placeholder="أيام مخصصة" />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-white/45">
            <input name="trialUseDefault" type="checkbox" defaultChecked={settings.trial.useDefault} /> استخدام القيمة الافتراضية للتجربة عند إنشاء العملاء الجدد
          </label>
          <button className="min-h-10 rounded-2xl bg-[#f3cf73] text-xs font-black text-[#17120a]">حفظ إعدادات المؤقتات</button>
        </form>
      </header>

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <TimerApplyPanel
          title="مؤقت التجربة المجانية"
          description="يظهر هنا العملاء الموجودون في مرحلة Trial فقط."
          timerType="trial"
          tenants={filteredTrial}
          allCount={trialTenants.length}
          query={trialQuery}
          setQuery={setTrialQuery}
          selected={trialSelection}
          setSelected={setTrialSelection}
          defaultDays={settings.trial.defaultDays}
          onToggle={toggle}
        />
        <TimerApplyPanel
          title="مؤقت الاشتراك"
          description="يظهر هنا العملاء أصحاب الاشتراكات الفعالة فقط."
          timerType="subscription"
          tenants={filteredActive}
          allCount={activeTenants.length}
          query={activeQuery}
          setQuery={setActiveQuery}
          selected={activeSelection}
          setSelected={setActiveSelection}
          defaultDays={settings.subscription.customDays}
          defaultPreset={settings.subscription.defaultPreset}
          onToggle={toggle}
        />
      </div>
    </section>
  );
}

function TimerApplyPanel({ title, description, timerType, tenants, allCount, query, setQuery, selected, setSelected, defaultDays, defaultPreset = "30", onToggle }: {
  title: string;
  description: string;
  timerType: "trial" | "subscription";
  tenants: TenantOption[];
  allCount: number;
  query: string;
  setQuery: (value: string) => void;
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  defaultDays: number;
  defaultPreset?: string;
  onToggle: (set: Set<string>, id: string) => Set<string>;
}) {
  return (
    <form action={applyLifecycleTimerAction} className="grid gap-3 rounded-3xl border border-white/10 bg-black/16 p-4">
      <input type="hidden" name="timerType" value={timerType} />
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-[#f3cf73]"><TimerReset className="size-4" /></span>
        <span>
          <h3 className="text-base font-black text-[#fff7e8]">{title}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-white/42">{description}</p>
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/8 px-3 text-sm font-black text-[#f3cf73]"><input type="radio" name="audience" value="all" /> تطبيق على الكل ({allCount})</label>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/65"><input type="radio" name="audience" value="selected" defaultChecked /> عملاء محددين</label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {timerType === "trial" ? <input name="trialDays" type="number" min={1} max={3650} defaultValue={defaultDays} className={inputClass} /> : (
          <>
            <select name="subscriptionPreset" defaultValue={defaultPreset} className={inputClass}>{lifecycleDurationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <input name="subscriptionCustomDays" type="number" min={1} max={3650} defaultValue={defaultDays} className={inputClass} />
          </>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث داخل العملاء…" className={`${inputClass} pr-10`} />
      </div>

      <button type="button" onClick={() => setSelected(new Set(tenants.map((tenant) => tenant.id)))} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] text-xs font-black text-white/55 hover:text-white"><Users className="size-4" /> تحديد الظاهرين</button>

      <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1 admin-scrollbar">
        {tenants.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs font-bold text-white/35">لا يوجد عملاء مطابقون.</div> : tenants.map((tenant) => (
          <label key={tenant.id} className="grid min-h-14 cursor-pointer grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 transition hover:border-amber-300/20 hover:bg-amber-300/8">
            <input type="checkbox" name="tenantIds" value={tenant.id} checked={selected.has(tenant.id)} onChange={() => setSelected(onToggle(selected, tenant.id))} />
            <span className="min-w-0"><strong className="block truncate text-sm font-black text-[#fff7e8]">{tenant.displayName}</strong><small className="block truncate text-xs font-bold text-white/40">{tenant.owner.email}</small></span>
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/42">{tenant.status}</span>
          </label>
        ))}
      </div>

      <button className="min-h-12 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-black text-[#17120a]">تطبيق المؤقت</button>
    </form>
  );
}
