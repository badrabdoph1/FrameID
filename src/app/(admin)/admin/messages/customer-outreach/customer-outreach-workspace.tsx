"use client";

import {
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  CirclePause,
  CirclePlay,
  Filter,
  Search,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type Customer = {
  id: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  subscriptions: Array<{ status: string; planId: string | null }>;
};

type Recipient = {
  id: string;
  tenantId: string | null;
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  tenantStatus: string;
};

type Campaign = {
  id: string;
  title: string;
  body: string;
  tone: string;
  status: string;
  audienceMode: string;
  createdByName: string;
  createdAt: string;
  pausedAt: string | null;
  recipientCount: number;
  recipients: Recipient[];
};

type WorkspaceProps = {
  customers: Customer[];
  plans: Array<{ id: string; name: string }>;
  campaigns: Campaign[];
  stats: { active: number; paused: number; recipients: number };
  feedback: { tone: "success" | "danger"; text: string; clearDraft?: boolean } | null;
  createAction: (formData: FormData) => void | Promise<void>;
  statusAction: (formData: FormData) => void | Promise<void>;
};

const tenantStatusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  EXPIRED: "منتهي",
  TRIAL_EXPIRED: "انتهت التجربة",
  SUSPENDED: "موقوف",
  DELETED: "محذوف من النظام",
};
const subscriptionStatusLabels: Record<string, string> = {
  ACTIVE: "اشتراك نشط",
  TRIAL: "تجريبي",
  EXPIRED: "منتهي",
  PAST_DUE: "متأخر",
  CANCELLED: "ملغي",
  SUSPENDED: "موقوف",
};
const toneLabels: Record<string, string> = { info: "معلومات", success: "نجاح", warning: "تنبيه", danger: "هام" };
const OUTREACH_DRAFT_KEY = "frameid:customer-outreach-draft:v1";

export function CustomerOutreachWorkspace({ customers, plans, campaigns, stats, feedback, createAction, statusAction }: WorkspaceProps) {
  const [copy, setCopy] = useState({ title: "", body: "", tone: "info" });
  const [audienceMode, setAudienceMode] = useState("ALL_MATCHING");
  const [filters, setFilters] = useState({ search: "", tenantStatus: "", subscriptionStatus: "", planId: "" });
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [campaignTone, setCampaignTone] = useState("");
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (feedback?.clearDraft) {
      window.sessionStorage.removeItem(OUTREACH_DRAFT_KEY);
      setDraftReady(true);
      return;
    }
    try {
      const stored = window.sessionStorage.getItem(OUTREACH_DRAFT_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as {
          copy?: typeof copy;
          audienceMode?: string;
          filters?: typeof filters;
          selected?: string[];
        };
        if (draft.copy) setCopy(draft.copy);
        if (draft.audienceMode === "ALL_MATCHING" || draft.audienceMode === "EXPLICIT") setAudienceMode(draft.audienceMode);
        if (draft.filters) setFilters(draft.filters);
        if (draft.selected) setSelected(new Set(draft.selected));
      }
    } catch {
      window.sessionStorage.removeItem(OUTREACH_DRAFT_KEY);
    }
    setDraftReady(true);
  }, [feedback?.clearDraft]);

  useEffect(() => {
    if (!draftReady) return;
    window.sessionStorage.setItem(OUTREACH_DRAFT_KEY, JSON.stringify({ copy, audienceMode, filters, selected: [...selected] }));
  }, [audienceMode, copy, draftReady, filters, selected]);

  const matchingCustomers = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("ar");
    return customers.filter((customer) => {
      const matchesSearch = !search || [customer.displayName, customer.ownerName, customer.ownerEmail].some((value) => value.toLocaleLowerCase("ar").includes(search));
      const matchesSubscription = (!filters.subscriptionStatus && !filters.planId) || customer.subscriptions.some((subscription) => (
        (!filters.subscriptionStatus || subscription.status === filters.subscriptionStatus)
        && (!filters.planId || subscription.planId === filters.planId)
      ));
      return matchesSearch
        && (!filters.tenantStatus || customer.status === filters.tenantStatus)
        && matchesSubscription;
    });
  }, [customers, filters]);

  const visibleCampaigns = useMemo(() => {
    const search = campaignSearch.trim().toLocaleLowerCase("ar");
    return campaigns.filter((campaign) => (
      (!search || `${campaign.title} ${campaign.body} ${campaign.createdByName}`.toLocaleLowerCase("ar").includes(search))
      && (!campaignStatus || campaign.status === campaignStatus)
      && (!campaignTone || campaign.tone === campaignTone)
    ));
  }, [campaignSearch, campaignStatus, campaignTone, campaigns]);

  const selectedCount = selected.size;
  const audienceCount = audienceMode === "ALL_MATCHING" ? matchingCustomers.length : selectedCount;
  const canSend = copy.title.trim().length > 0 && copy.body.trim().length > 0 && audienceCount > 0;
  const toggleCustomer = (customerId: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(customerId)) next.delete(customerId); else next.add(customerId);
    return next;
  });
  const selectMatching = () => setSelected(new Set(matchingCustomers.map((customer) => customer.id)));

  return (
    <div className="grid gap-5">
      {feedback ? <div role={feedback.tone === "danger" ? "alert" : "status"} className={feedback.tone === "danger" ? "rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-black text-red-200" : "rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200"}>{feedback.text}</div> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="حملات ظاهرة الآن" value={stats.active} icon={BellRing} tone="gold" />
        <Metric label="حملات متوقفة" value={stats.paused} icon={CirclePause} tone="slate" />
        <Metric label="إجمالي مرات الاستلام" value={stats.recipients} icon={Users} tone="blue" />
      </section>

      <form action={createAction} onSubmit={(event) => {
        const audience = audienceMode === "ALL_MATCHING"
          ? matchingCustomers
          : customers.filter((customer) => selected.has(customer.id));
        const sample = audience.slice(0, 3).map((customer) => customer.displayName).join("، ");
        const countText = audienceCount === 1 ? "عميل واحد" : audienceCount === 2 ? "عميلين" : `${audienceCount.toLocaleString("ar-EG")} عملاء`;
        if (!window.confirm(`تأكيد إرسال الرسالة إلى ${countText}${sample ? `: ${sample}${audience.length > 3 ? "…" : ""}` : ""}؟`)) event.preventDefault();
      }} className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
        {audienceMode === "EXPLICIT" ? [...selected].map((tenantId) => <input key={tenantId} type="hidden" name="tenantIds" value={tenantId} />) : null}
        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(243,207,115,0.07),rgba(255,255,255,0.02)_45%)] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#f3cf73] text-[#17120a]"><Send className="size-5" /></span>
            <div><p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#f3cf73]/65">الرسالة</p><h2 className="text-lg font-black text-[#fff7e8]">اكتب الرسالة</h2></div>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-xs font-black text-white/55">عنوان الرسالة
              <input name="title" aria-label="عنوان الرسالة" maxLength={120} value={copy.title} onChange={(event) => setCopy((current) => ({ ...current, title: event.target.value }))} placeholder="مثال: أضفنا أدوات جديدة لحسابك" className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#f3cf73]/45 focus:ring-2 focus:ring-[#f3cf73]/10" />
            </label>
            <label className="grid gap-2 text-xs font-black text-white/55">نص الرسالة
              <textarea name="body" aria-label="نص الرسالة" maxLength={1200} rows={6} value={copy.body} onChange={(event) => setCopy((current) => ({ ...current, body: event.target.value }))} placeholder="اكتب ما تريد أن يظهر داخل كارت الإشعار في لوحة العميل…" className="resize-y rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-[#f3cf73]/45 focus:ring-2 focus:ring-[#f3cf73]/10" />
            </label>
            <fieldset><legend className="mb-2 text-xs font-black text-white/55">شكل الكارت</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["info", "success", "warning", "danger"].map((tone) => <label key={tone} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-black transition ${copy.tone === tone ? toneClass(tone, true) : "border-white/8 bg-white/[0.025] text-white/45 hover:bg-white/[0.05]"}`}><input className="sr-only" type="radio" name="tone" value={tone} checked={copy.tone === tone} onChange={() => setCopy((current) => ({ ...current, tone }))} />{toneLabels[tone]}</label>)}</div></fieldset>
            <div className={`rounded-2xl border p-4 ${toneClass(copy.tone, false)}`}><p className="text-[0.65rem] font-black opacity-60">معاينة داخل لوحة العميل</p><strong className="mt-1 block text-sm font-black">{copy.title || "عنوان الرسالة يظهر هنا"}</strong><p className="mt-1 whitespace-pre-wrap text-xs font-bold leading-6 opacity-75">{copy.body || "سيظهر نص رسالتك هنا بنفس ترتيب السطور."}</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-sky-300/60">الجمهور الحي</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">حدد من تصله الرسالة</h2></div><span className="rounded-full border border-sky-300/15 bg-sky-300/[0.07] px-3 py-1.5 text-xs font-black text-sky-200">{audienceMode === "ALL_MATCHING" ? matchingLabel(audienceCount) : selectedLabel(audienceCount)}</span></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <AudienceMode label="كل النتائج المطابقة" description="يشمل كل عميل يطابق الفلاتر وقت الإرسال." value="ALL_MATCHING" current={audienceMode} onChange={setAudienceMode} />
            <AudienceMode label="اختيار عملاء محددين" description="أرسل فقط للأسماء التي تختارها يدويًا." value="EXPLICIT" current={audienceMode} onChange={setAudienceMode} />
          </div>
          <input type="hidden" name="audienceMode" value={audienceMode} />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="relative sm:col-span-2"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input aria-label="بحث الجمهور" name="search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="ابحث باسم العميل أو المالك أو البريد" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-3 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-sky-300/35" /></label>
            <FilterSelect label="حالة العميل" name="tenantStatus" value={filters.tenantStatus} onChange={(value) => setFilters((current) => ({ ...current, tenantStatus: value }))} options={tenantStatusLabels} />
            <FilterSelect label="حالة الاشتراك" name="subscriptionStatus" value={filters.subscriptionStatus} onChange={(value) => setFilters((current) => ({ ...current, subscriptionStatus: value }))} options={subscriptionStatusLabels} />
            <label className="grid gap-1 text-[0.68rem] font-black text-white/42 sm:col-span-2">الباقة<select aria-label="الباقة" name="planId" value={filters.planId} onChange={(event) => setFilters((current) => ({ ...current, planId: event.target.value }))} className="min-h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-xs font-bold text-white"><option value="">كل الباقات</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>
          </div>
          {audienceMode === "EXPLICIT" ? <div className="mt-4 overflow-hidden rounded-2xl border border-white/8"><div className="flex items-center justify-between border-b border-white/8 bg-black/15 px-3 py-2"><span className="text-xs font-black text-white/45">العملاء المطابقون</span><button type="button" onClick={selectMatching} className="text-xs font-black text-sky-200">تحديد الظاهر</button></div><div className="max-h-64 overflow-y-auto p-2">{matchingCustomers.length ? matchingCustomers.map((customer) => <label key={customer.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]"><input type="checkbox" value={customer.id} aria-label={`اختيار ${customer.displayName}`} checked={selected.has(customer.id)} onChange={() => toggleCustomer(customer.id)} className="mt-1 size-4 accent-[#f3cf73]" /><span className="min-w-0"><strong className="block truncate text-xs font-black text-white/75">{customer.displayName}</strong><small className="block truncate text-[0.68rem] font-bold text-white/35">{customer.ownerName} · {customer.ownerEmail}</small></span></label>) : <p className="p-5 text-center text-xs font-bold text-white/35">لا يوجد عملاء مطابقون لهذه الفلاتر.</p>}</div></div> : <p className="mt-4 rounded-2xl border border-sky-300/12 bg-sky-300/[0.045] px-4 py-3 text-xs font-bold leading-6 text-sky-100/65">سيعيد الخادم حساب الفلاتر لحظة الإرسال، لذلك يدخل أي عميل مطابق حتى لو أُضيف بعد فتح الصفحة.</p>}
          <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold text-white/38">ستظهر الحملة فورًا ويمكن إيقافها من السجل أدناه.</p><SendButton disabled={!canSend} /></div>
        </section>
      </form>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/30">السجل</p><h2 className="mt-1 text-xl font-black text-[#fff7e8]">حملات مراسلة العملاء</h2><p className="mt-1 text-xs font-bold text-white/38">كل رسالة، جمهورها الحقيقي، وحالتها الحالية في مكان واحد.</p></div><div className="grid gap-2 sm:grid-cols-3"><label className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input aria-label="بحث الحملات" value={campaignSearch} onChange={(event) => setCampaignSearch(event.target.value)} placeholder="ابحث في السجل" className="min-h-10 rounded-xl border border-white/10 bg-black/20 pr-9 pl-3 text-xs font-bold text-white outline-none" /></label><select aria-label="حالة الحملات" value={campaignStatus} onChange={(event) => setCampaignStatus(event.target.value)} className="min-h-10 rounded-xl border border-white/10 bg-[#171717] px-3 text-xs font-bold text-white"><option value="">كل الحالات</option><option value="ACTIVE">نشطة</option><option value="PAUSED">متوقفة</option></select><select aria-label="نبرة الحملات" value={campaignTone} onChange={(event) => setCampaignTone(event.target.value)} className="min-h-10 rounded-xl border border-white/10 bg-[#171717] px-3 text-xs font-bold text-white"><option value="">كل الأنواع</option>{Object.entries(toneLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
        <div className="mt-5 grid gap-3">{visibleCampaigns.length ? visibleCampaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} expanded={expandedCampaign === campaign.id} onToggle={() => { setExpandedCampaign((current) => current === campaign.id ? null : campaign.id); setRecipientSearch(""); }} recipientSearch={recipientSearch} onRecipientSearch={setRecipientSearch} statusAction={statusAction} />) : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center"><Filter className="mx-auto size-6 text-white/20" /><p className="mt-3 text-sm font-black text-white/40">لا توجد حملات تطابق الفلاتر الحالية.</p></div>}</div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: "gold" | "blue" | "slate" }) {
  const color = tone === "gold" ? "bg-amber-300/10 text-amber-200" : tone === "blue" ? "bg-sky-300/10 text-sky-200" : "bg-white/[0.06] text-white/45";
  return <article className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-4" /></span><span><strong className="block text-xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</strong><small className="text-xs font-bold text-white/38">{label}</small></span></article>;
}

function AudienceMode({ label, description, value, current, onChange }: { label: string; description: string; value: string; current: string; onChange: (value: string) => void }) {
  const active = current === value;
  return <label className={`cursor-pointer rounded-2xl border p-3 transition ${active ? "border-sky-300/25 bg-sky-300/[0.07]" : "border-white/8 bg-black/10 hover:bg-white/[0.03]"}`}><span className="flex items-center gap-2"><input type="radio" name="audienceModeChoice" aria-label={label} checked={active} onChange={() => onChange(value)} className="accent-sky-300" /><strong className={active ? "text-xs font-black text-sky-100" : "text-xs font-black text-white/60"}>{label}</strong></span><small className="mt-1 block pr-5 text-[0.65rem] font-bold leading-5 text-white/32">{description}</small></label>;
}

function FilterSelect({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (value: string) => void; options: Record<string, string> }) {
  return <label className="grid gap-1 text-[0.68rem] font-black text-white/42">{label}<select aria-label={label} name={name} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#171717] px-3 text-xs font-bold text-white"><option value="">الكل</option>{Object.entries(options).map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-5 text-xs font-black text-[#17120a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"><Send className="size-4" />{pending ? "جاري الإرسال…" : "إرسال الرسالة الآن"}</button>;
}

function CampaignCard({ campaign, expanded, onToggle, recipientSearch, onRecipientSearch, statusAction }: { campaign: Campaign; expanded: boolean; onToggle: () => void; recipientSearch: string; onRecipientSearch: (value: string) => void; statusAction: WorkspaceProps["statusAction"] }) {
  const recipients = campaign.recipients.filter((recipient) => `${recipient.tenantName} ${recipient.ownerName} ${recipient.ownerEmail}`.toLocaleLowerCase("ar").includes(recipientSearch.trim().toLocaleLowerCase("ar")));
  const active = campaign.status === "ACTIVE";
  const recipientPanelId = `campaign-recipients-${campaign.id}`;
  return <article className={`overflow-hidden rounded-2xl border transition ${active ? "border-white/9 bg-white/[0.032]" : "border-white/6 bg-black/15 opacity-80"}`}><div className="grid gap-4 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start"><span className={`grid size-10 place-items-center rounded-xl ${toneClass(campaign.tone, true)}`}>{active ? <BellRing className="size-4" /> : <CirclePause className="size-4" />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-[#fff7e8]">{campaign.title}</h3><span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${active ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.06] text-white/40"}`}>{active ? "ظاهرة الآن" : "متوقفة"}</span><span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[0.65rem] font-black text-white/40">{toneLabels[campaign.tone] ?? campaign.tone}</span></div><p className="mt-2 whitespace-pre-wrap text-xs font-bold leading-6 text-white/55">{campaign.body}</p><p className="mt-2 text-[0.68rem] font-bold text-white/28">{campaign.createdByName} · {new Date(campaign.createdAt).toLocaleString("ar-EG")} · {campaign.audienceMode === "ALL_MATCHING" ? "كل النتائج المطابقة" : "اختيار محدد"}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><button type="button" onClick={onToggle} aria-label={`عرض مستلمي ${campaign.title}`} aria-expanded={expanded} aria-controls={recipientPanelId} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/60"><Users className="size-3.5" />{campaign.recipientCount.toLocaleString("ar-EG")}{expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}</button><form action={statusAction}><input type="hidden" name="campaignId" value={campaign.id} /><input type="hidden" name="status" value={active ? "PAUSED" : "ACTIVE"} /><button className={active ? "inline-flex min-h-9 items-center gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 text-xs font-black text-amber-100" : "inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-300 px-3 text-xs font-black text-[#092016]"}>{active ? <CirclePause className="size-3.5" /> : <CirclePlay className="size-3.5" />}{active ? "إيقاف الحملة" : "تشغيل الحملة"}</button></form></div></div>{expanded ? <div id={recipientPanelId} role="region" aria-label={`مستلمو ${campaign.title}`} className="border-t border-white/8 bg-black/15 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-xs font-black text-white/65">الأشخاص الذين استلموا الرسالة</h4><p className="mt-1 text-[0.68rem] font-bold text-white/30">لقطة ثابتة بأسماء المستلمين وقت الإرسال{campaign.recipientCount > campaign.recipients.length ? ` · أحدث ${campaign.recipients.length.toLocaleString("ar-EG")} هنا` : ""}.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-white/25" /><input aria-label={`بحث مستلمي ${campaign.title}`} value={recipientSearch} onChange={(event) => onRecipientSearch(event.target.value)} placeholder="ابحث في المعروض" className="min-h-9 rounded-xl border border-white/8 bg-black/25 pr-9 pl-3 text-xs font-bold text-white outline-none" /></label><Link href={`/admin/messages/customer-outreach/${campaign.id}`} className="inline-flex min-h-9 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-3 text-xs font-black text-sky-100">فتح السجل الكامل</Link></div></div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{recipients.map((recipient) => <div key={recipient.id} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-300/8 text-emerald-200"><Check className="size-3.5" /></span><span className="min-w-0"><strong className="block truncate text-xs font-black text-white/65">{recipient.tenantName}</strong><small className="block truncate text-[0.68rem] font-bold text-white/35">{recipient.ownerName}</small><small className="block truncate text-[0.65rem] font-bold text-white/25">{recipient.ownerEmail}</small><small className="mt-1 block text-[0.62rem] font-black text-white/30">{tenantStatusLabels[recipient.tenantStatus] ?? recipient.tenantStatus}</small></span></div>)}{recipients.length === 0 ? <p className="col-span-full py-5 text-center text-xs font-bold text-white/35">لا يوجد مستلم يطابق البحث.</p> : null}</div></div> : null}</article>;
}

function matchingLabel(count: number) { if (count === 0) return "لا يوجد عملاء مطابقون"; if (count === 1) return "عميل واحد مطابق"; if (count === 2) return "عميلان مطابقان"; return `${count.toLocaleString("ar-EG")} عملاء مطابقون`; }
function selectedLabel(count: number) { if (count === 0) return "لم تحدد عملاء"; if (count === 1) return "عميل واحد محدد"; if (count === 2) return "عميلان محددان"; return `${count.toLocaleString("ar-EG")} عملاء محددون`; }
function toneClass(tone: string, compact: boolean) { const spacing = compact ? "border" : ""; if (tone === "success") return `${spacing} border-emerald-300/18 bg-emerald-300/[0.08] text-emerald-100`; if (tone === "warning") return `${spacing} border-amber-300/18 bg-amber-300/[0.08] text-amber-100`; if (tone === "danger") return `${spacing} border-red-300/18 bg-red-300/[0.08] text-red-100`; return `${spacing} border-sky-300/18 bg-sky-300/[0.08] text-sky-100`; }
