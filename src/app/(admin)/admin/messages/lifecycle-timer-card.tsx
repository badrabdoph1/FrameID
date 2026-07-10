"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Search, ShieldCheck, Sparkles, Users } from "lucide-react";

import { applyLifecycleTimerAction, saveLifecycleTimersAction } from "@/app/(admin)/admin/messages/actions";
import { lifecycleDurationOptions, type LifecycleTimerSettings } from "@/modules/lifecycle/customer-lifecycle";

type TenantOption = {
  id: string;
  displayName: string;
  status: string;
  lifecycleEndAt?: string | null;
  daysRemaining?: number | null;
  owner: { email: string; name: string };
};

type Props = {
  settings: LifecycleTimerSettings;
  trialTenants: TenantOption[];
  activeTenants: TenantOption[];
};

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-[#0b0d12]/70 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

function filterTenants(tenants: TenantOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return tenants;
  return tenants.filter((tenant) => `${tenant.displayName} ${tenant.owner.email} ${tenant.owner.name}`.toLowerCase().includes(q));
}

function formatEndDate(value?: string | null) {
  if (!value) return "دائم";
  return new Date(value).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

function daysText(days?: number | null) {
  if (days === null || days === undefined) return "دائم";
  if (days <= 0) return "منتهي";
  return `متبقي ${days} يوم`;
}

export function LifecycleTimerCard({ settings, trialTenants, activeTenants }: Props) {
  const [activeTab, setActiveTab] = useState<"trial" | "subscription">("trial");
  const [trialQuery, setTrialQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [trialSelection, setTrialSelection] = useState<Set<string>>(new Set());
  const [activeSelection, setActiveSelection] = useState<Set<string>>(new Set());

  const filteredTrial = useMemo(() => filterTenants(trialTenants, trialQuery), [trialTenants, trialQuery]);
  const filteredActive = useMemo(() => filterTenants(activeTenants, activeQuery), [activeTenants, activeQuery]);
  const currentTenants = activeTab === "trial" ? filteredTrial : filteredActive;
  const totalEligible = activeTab === "trial" ? trialTenants.length : activeTenants.length;
  const selected = activeTab === "trial" ? trialSelection : activeSelection;
  const setSelected = activeTab === "trial" ? setTrialSelection : setActiveSelection;
  const query = activeTab === "trial" ? trialQuery : activeQuery;
  const setQuery = activeTab === "trial" ? setTrialQuery : setActiveQuery;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="overflow-hidden rounded-[1.85rem] border border-amber-300/16 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] shadow-[0_26px_90px_rgba(0,0,0,0.24)]">
      <header className="grid gap-4 border-b border-white/10 p-4 lg:grid-cols-[1fr_minmax(360px,500px)] lg:items-start lg:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73] shadow-[0_0_30px_rgba(243,207,115,0.12)]">
            <Clock3 className="size-5" />
          </span>
          <span className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#f3cf73]">Customer Lifecycle</p>
            <h2 className="mt-1 text-xl font-black leading-tight text-[#fff7e8] lg:text-2xl">مؤقت لوحة التحكم</h2>
            <p className="mt-1 max-w-2xl text-xs font-bold leading-6 text-white/48 lg:text-sm">
              إدارة ذكية لمدة التجربة والاشتراك. الوضع الافتراضي لا يغير مدة العملاء؛ كل عميل يحتفظ بتاريخ انتهائه الحالي.
            </p>
          </span>
        </div>

        <form action={saveLifecycleTimersAction} className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleField name="trialEnabled" label="تشغيل التجربة" defaultChecked={settings.trial.enabled} />
            <ToggleField name="subscriptionEnabled" label="تشغيل الاشتراك" defaultChecked={settings.subscription.enabled} />
          </div>
          <div className="grid gap-2 sm:grid-cols-[0.75fr_1fr_0.75fr]">
            <label className="grid gap-1.5">
              <span className="text-[0.68rem] font-black text-white/42">أيام التجربة</span>
              <input name="trialDays" type="number" min={1} max={3650} defaultValue={settings.trial.defaultDays} className={inputClass} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[0.68rem] font-black text-white/42">افتراضي الاشتراك</span>
              <select name="subscriptionPreset" defaultValue={settings.subscription.defaultPreset} className={inputClass}>
                {lifecycleDurationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[0.68rem] font-black text-white/42">مخصص</span>
              <input name="subscriptionCustomDays" type="number" min={1} max={3650} defaultValue={settings.subscription.customDays} className={inputClass} />
            </label>
          </div>
          <label className="flex items-start gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-bold leading-5 text-white/48">
            <input name="trialUseDefault" type="checkbox" defaultChecked={settings.trial.useDefault} className="mt-1" />
            استخدام القيمة الافتراضية للتجربة عند إنشاء عملاء جدد.
          </label>
          <button className="min-h-11 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a]">حفظ إعدادات المؤقتات</button>
        </form>
      </header>

      <div className="grid gap-4 p-4 lg:p-5">
        <div className="grid gap-2 rounded-[1.25rem] border border-white/10 bg-black/16 p-1.5 sm:grid-cols-2">
          <TabButton active={activeTab === "trial"} onClick={() => setActiveTab("trial")} title="مؤقت التجربة" count={trialTenants.length} icon={CalendarClock} />
          <TabButton active={activeTab === "subscription"} onClick={() => setActiveTab("subscription")} title="مؤقت الاشتراك" count={activeTenants.length} icon={ShieldCheck} />
        </div>

        <form action={applyLifecycleTimerAction} className="grid gap-4 rounded-[1.45rem] border border-white/10 bg-[#0d1016]/70 p-4 lg:grid-cols-[minmax(260px,0.8fr)_1.2fr] lg:p-5">
          <input type="hidden" name="timerType" value={activeTab} />
          {[...selected].map((id) => <input key={id} type="hidden" name="tenantIds" value={id} />)}

          <aside className="grid gap-3 content-start">
            <div className="rounded-3xl border border-amber-300/14 bg-amber-300/[0.055] p-4">
              <Sparkles className="size-5 text-[#f3cf73]" />
              <h3 className="mt-3 text-lg font-black text-[#fff7e8]">{activeTab === "trial" ? "تطبيق مؤقت التجربة" : "تطبيق مؤقت الاشتراك"}</h3>
              <p className="mt-1 text-xs font-bold leading-6 text-white/48">
                {activeTab === "trial" ? "العملاء الظاهرون هنا هم التجريبيون فقط." : "العملاء الظاهرون هنا هم أصحاب الاشتراكات الفعالة فقط."}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-amber-300/22 bg-amber-300/10 px-3 text-sm font-black text-[#f3cf73]">
                <input type="radio" name="audience" value="all" />
                تطبيق على الكل
                <span className="mr-auto rounded-full bg-black/18 px-2 py-0.5 text-xs">{totalEligible}</span>
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/65">
                <input type="radio" name="audience" value="selected" defaultChecked />
                العملاء المحددون
                <span className="mr-auto rounded-full bg-black/18 px-2 py-0.5 text-xs">{selected.size}</span>
              </label>
            </div>

            <div className="grid gap-2 rounded-2xl border border-white/8 bg-black/14 p-3">
              <label className="flex items-start gap-2 text-xs font-bold leading-5 text-white/55">
                <input type="radio" name="timerMode" value="keep" defaultChecked className="mt-1" />
                <span><strong className="block text-white/80">الوضع الذكي</strong> يحافظ على تاريخ انتهاء كل عميل كما هو.</span>
              </label>
              {activeTab === "trial" ? (
                <label className="grid gap-1.5 text-xs font-black text-white/42">
                  تطبيق أيام جديدة
                  <input name="trialDays" type="number" min={1} max={3650} defaultValue={settings.trial.defaultDays} className={inputClass} />
                  <span className="text-[0.68rem] font-bold text-white/32">فعّل هذا الاختيار من الزر التالي إذا أردت تغيير المدة.</span>
                  <label className="mt-1 flex items-center gap-2 text-xs font-bold text-white/45"><input type="radio" name="timerMode" value="days" /> استخدم الأيام المكتوبة بدل الوضع الذكي</label>
                </label>
              ) : (
                <div className="grid gap-2">
                  <label className="grid gap-1.5 text-xs font-black text-white/42">
                    مدة جديدة اختيارية
                    <select name="subscriptionPreset" defaultValue="keep" className={inputClass}>{lifecycleDurationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  </label>
                  <input name="subscriptionCustomDays" type="number" min={1} max={3650} defaultValue={settings.subscription.customDays} className={inputClass} />
                </div>
              )}
            </div>

            <button className="min-h-12 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5">تطبيق المؤقت</button>
          </aside>

          <section className="grid min-w-0 gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث داخل العملاء…" className={`${inputClass} pr-10`} />
            </div>

            <div className="grid max-h-[430px] gap-2 overflow-y-auto pr-1 admin-scrollbar lg:max-h-[520px]">
              {currentTenants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-white/35">لا يوجد عملاء مطابقون.</div>
              ) : currentTenants.map((tenant) => (
                <label key={tenant.id} className="grid min-h-[4.35rem] cursor-pointer grid-cols-[auto,1fr] gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2.5 transition hover:border-amber-300/20 hover:bg-amber-300/8 sm:grid-cols-[auto,1fr,auto]">
                  <input type="checkbox" checked={selected.has(tenant.id)} onChange={() => toggle(tenant.id)} className="mt-2" />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{tenant.displayName}</strong>
                    <small className="mt-0.5 block truncate text-xs font-bold text-white/40">{tenant.owner.email}</small>
                    <small className="mt-1 block text-[0.68rem] font-black text-[#f3cf73]/75 sm:hidden">{daysText(tenant.daysRemaining)} · {formatEndDate(tenant.lifecycleEndAt)}</small>
                  </span>
                  <span className="hidden text-left sm:block">
                    <strong className="block text-xs font-black text-white/68">{daysText(tenant.daysRemaining)}</strong>
                    <small className="mt-0.5 block text-[0.68rem] font-bold text-white/34">{formatEndDate(tenant.lifecycleEndAt)}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </form>
      </div>
    </section>
  );
}

function ToggleField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-3 text-xs font-black text-white/60"><input name={name} type="checkbox" defaultChecked={defaultChecked} /> {label}</label>;
}

function TabButton({ active, onClick, title, count, icon: Icon }: { active: boolean; onClick: () => void; title: string; count: number; icon: typeof Clock3 }) {
  return (
    <button type="button" onClick={onClick} className={active ? "flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-amber-300/28 bg-amber-300/12 px-3 text-sm font-black text-[#f3cf73]" : "flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-transparent px-3 text-sm font-black text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"}>
      <span className="inline-flex items-center gap-2"><Icon className="size-4" /> {title}</span>
      <span className="rounded-full bg-black/18 px-2 py-0.5 text-xs">{count}</span>
    </button>
  );
}
