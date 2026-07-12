"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  Eye,
  Globe2,
  LayoutDashboard,
  RotateCcw,
  X,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { CompletionRing } from "@/components/dashboard/builder-primitives";
import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";

type BannerTone = "success" | "warning" | "danger" | "info";

const CHECKLIST_STORAGE_KEY = "frameid:onboarding-checklist";

type OnboardingPreferences = {
  hidden?: boolean;
  expanded?: boolean;
  introAcknowledged?: boolean;
};

const onboardingCopy: Record<string, { label: string; description: string }> = {
  package: { label: "راجع الباقات والأسعار", description: "تأكد من أسماء الباقات والأسعار والمميزات." },
  contact: { label: "غيّر اسم الاستوديو وراجع التواصل", description: "راجع الهاتف وواتساب والبريد وروابطك." },
  avatar: { label: "أضف شعارك أو صورتك", description: "استخدم صورة واضحة تمثل هويتك." },
  cover: { label: "غيّر صورة الغلاف", description: "اختر صورة رئيسية قوية لموقعك." },
  album: { label: "غيّر صورك", description: "أضف أعمالك الحقيقية داخل الألبومات." },
};

export function DashboardHomeClient({ siteTitle, siteUrl, statusLabel, percent, checklist, lastModified, isPublished, nextStepHref, nextStepLabel, subscription, customerMessages }: DashboardViewModel) {
  const doneCount = checklist.filter((item) => item.done).length;
  const [checklistHidden, setChecklistHidden] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  const [introAcknowledged, setIntroAcknowledged] = useState(true);

  const onboardingItems = useMemo(
    () => checklist
      .filter((item) => onboardingCopy[item.id])
      .map((item) => ({ ...item, ...onboardingCopy[item.id] })),
    [checklist],
  );
  const onboardingDoneCount = onboardingItems.filter((item) => item.done).length;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (!saved) {
        setIntroAcknowledged(false);
        return;
      }
      const preferences = JSON.parse(saved) as OnboardingPreferences;
      setChecklistHidden(Boolean(preferences.hidden));
      setChecklistExpanded(preferences.expanded !== false);
      setIntroAcknowledged(preferences.introAcknowledged === true);
    } catch {
      // Invalid browser storage must never block the dashboard.
    }
  }, []);

  const saveChecklistPreferences = (hidden: boolean, expanded: boolean) => {
    setChecklistHidden(hidden);
    setChecklistExpanded(expanded);
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify({ hidden, expanded, introAcknowledged }));
    } catch {
      // Browsers may disable localStorage; the current session still works.
    }
  };

  const acknowledgeDashboardContext = () => {
    setIntroAcknowledged(true);
    try {
      window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify({
        hidden: checklistHidden,
        expanded: checklistExpanded,
        introAcknowledged: true,
      } satisfies OnboardingPreferences));
    } catch {
      // Browsers may disable localStorage; the current session still works.
    }
  };

  const ownerViewUrl = `${siteUrl}${siteUrl.includes("?") ? "&" : "?"}ownerView=1`;

  return (
    <main className="customer-dashboard-home mx-auto grid w-full max-w-5xl gap-5 pb-4 sm:gap-6 lg:max-w-[1180px] lg:gap-6">
      <DashboardContextNotice
        prominent={!introAcknowledged}
        onAcknowledge={acknowledgeDashboardContext}
      />

      {subscription?.showLifecycleCard ? <LifecycleStatusCard subscription={subscription} /> : null}

      {customerMessages.length > 0 ? <section className="grid gap-2 lg:grid-cols-2">{customerMessages.map((message) => <CustomerMessageBanner key={message.id} message={message} />)}</section> : null}

      <section className="customer-dashboard-published-card overflow-hidden rounded-[1.45rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_38%),#10151d] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-4 lg:p-5" aria-labelledby="published-site-title">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-6">
          <div className="relative min-h-[220px] overflow-hidden rounded-[1.2rem] border border-white/12 bg-[#07090d] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-h-[250px] lg:min-h-[270px]">
            {isPublished ? (
              <>
                <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between border-b border-white/10 bg-black/72 px-3 backdrop-blur-sm">
                  <div className="flex gap-1.5" dir="ltr" aria-hidden>
                    <span className="size-1.5 rounded-full bg-red-300/80" />
                    <span className="size-1.5 rounded-full bg-amber-200/80" />
                    <span className="size-1.5 rounded-full bg-emerald-300/80" />
                  </div>
                  <span className="text-[0.6rem] font-black text-white/48">معاينة حقيقية</span>
                </div>
                <iframe
                  title={`معاينة موقع ${siteTitle}`}
                  src={siteUrl}
                  loading="lazy"
                  tabIndex={-1}
                  className="customer-published-site-frame pointer-events-none absolute right-0 top-8 border-0"
                />
              </>
            ) : (
              <div className="grid h-full min-h-[220px] place-items-center p-6 text-center sm:min-h-[250px] lg:min-h-[270px]">
                <div>
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/10 text-[#f3cf73]">
                    <Globe2 className="size-6" aria-hidden />
                  </span>
                  <strong className="mt-4 block text-base font-black text-[#fff7e8]">الموقع ما زال مسودة</strong>
                  <span className="mt-1 block text-xs font-bold leading-5 text-white/48">بعد النشر ستظهر هنا معاينة الموقع الذي سيراه عملاؤك.</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center text-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-7 items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 text-[0.68rem] font-black text-[#f3cf73]">الموقع العام</span>
              <span className={isPublished ? "inline-flex min-h-7 items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 text-[0.68rem] font-black text-emerald-200" : "inline-flex min-h-7 items-center rounded-full border border-white/12 bg-white/[0.045] px-2.5 text-[0.68rem] font-black text-white/55"}>{statusLabel}</span>
            </div>
            <h2 id="published-site-title" className="mt-3 text-2xl font-black tracking-tight text-[#fff7e8] sm:text-3xl">موقعك المنشور</h2>
            <p className="mt-1 text-sm font-black text-white/72">{siteTitle}</p>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-white/58">
              هذا هو الموقع الذي سيراه عملاؤك عند فتح الرابط.
              <strong className="block text-[#ffe49a]">لوحة التحكم هذه لا يراها أي عميل.</strong>
            </p>

            <div className="mt-4 min-w-0 rounded-2xl border border-white/10 bg-black/18 p-3">
              <p className="text-xs font-black text-white/52">الرابط الذي سترسله لعملائك</p>
              <p dir="ltr" className="mt-1 truncate text-start text-sm font-black text-[#f3cf73] sm:text-base">{siteUrl}</p>
            </div>

            {isPublished ? (
              <DashboardSiteActions siteUrl={siteUrl} className="mt-4" />
            ) : (
              <Link href="/dashboard/publish" className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-[#ffe08a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf73] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151d] motion-reduce:transform-none motion-reduce:transition-none">
                أكمل النشر لعرض موقعك للعملاء <ArrowLeft className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="customer-dashboard-readiness-card rounded-[1.35rem] border border-white/12 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.045)),#10151d] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-4">
        <div className="flex items-center justify-between gap-3 lg:h-full">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#f3cf73] lg:text-sm">جاهزية الموقع</p>
            <h1 className="mt-0.5 truncate text-base font-black text-[#fff7e8] sm:text-lg lg:mt-2 lg:text-2xl">{doneCount} من {checklist.length} خطوات</h1>
            <p className="mt-1 truncate text-[0.72rem] font-bold text-white/55 lg:text-sm">{statusLabel}</p>
            <p className="mt-1 truncate text-[0.72rem] font-bold text-white/55 lg:mt-3 lg:text-xs">آخر تعديل {lastModified}</p>
          </div>
          <div className="scale-75 rounded-full bg-black/18 p-1 sm:scale-90 lg:scale-100 lg:bg-black/22"><CompletionRing percent={percent} /></div>
        </div>
      </section>

      {checklistHidden ? (
        <button
          type="button"
          onClick={() => saveChecklistPreferences(false, true)}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-2xl border border-white/10 bg-[#111720] px-3 text-xs font-black text-white/70 transition hover:border-amber-300/25 hover:text-[#f3cf73]"
        >
          <RotateCcw className="size-4" aria-hidden /> إظهار خطوات البداية
        </button>
      ) : (
        <section className="overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#111720] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_18px_48px_rgba(0,0,0,0.18)]">
          <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.035))] p-3">
            <button type="button" onClick={() => saveChecklistPreferences(false, !checklistExpanded)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/12 text-[#f3cf73] shadow-sm">
                {checklistExpanded ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-black text-[#fff7e8] sm:text-base">ابدأ تجهيز موقعك</strong>
                <small className="mt-0.5 block truncate text-[0.68rem] font-bold text-white/55 sm:text-xs">{onboardingDoneCount} من {onboardingItems.length} مكتملة</small>
              </span>
            </button>
            <button type="button" onClick={() => saveChecklistPreferences(true, checklistExpanded)} aria-label="إخفاء خطوات البداية" className="grid size-9 shrink-0 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.06] hover:text-white">
              <X className="size-4" aria-hidden />
            </button>
          </header>
          {checklistExpanded ? (
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:gap-3">
              {onboardingItems.map((item, index) => <SetupStepRow key={item.id} item={item} index={index + 1} />)}
            </div>
          ) : null}
        </section>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:gap-4">
        <Link href={nextStepHref} className="customer-dashboard-action-card inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20">{nextStepLabel}<ArrowLeft className="size-4" aria-hidden /></Link>
        {isPublished ? <Link href={ownerViewUrl} target="_blank" rel="noreferrer" className="customer-dashboard-action-card inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white"><ExternalLink className="size-4" aria-hidden /> شاهد الموقع كما يراه العميل</Link> : <Link href="/dashboard/publish" className="customer-dashboard-action-card inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white"><Globe2 className="size-4" aria-hidden /> راجع حالة النشر</Link>}
      </div>
    </main>
  );
}

function DashboardContextNotice({ prominent, onAcknowledge }: { prominent: boolean; onAcknowledge: () => void }) {
  return (
    <section
      className={prominent
        ? "customer-dashboard-context-notice grid gap-3 rounded-[1.25rem] border border-sky-300/22 bg-[linear-gradient(135deg,rgba(125,211,252,0.12),rgba(255,255,255,0.035)),#10151d] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] sm:grid-cols-[auto_1fr_auto] sm:items-center"
        : "customer-dashboard-context-notice flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5"}
      aria-label="أنت داخل لوحة الإدارة"
    >
      <span className={prominent ? "grid size-11 shrink-0 place-items-center rounded-2xl border border-sky-300/18 bg-sky-300/10 text-sky-200" : "grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.055] text-[#f3cf73]"}>
        <LayoutDashboard className={prominent ? "size-5" : "size-4"} aria-hidden />
      </span>
      <span className="min-w-0">
        <strong className={prominent ? "block text-base font-black text-[#fff7e8]" : "block text-xs font-black text-[#fff7e8] sm:text-sm"}>أنت الآن داخل لوحة إدارة موقعك.</strong>
        <span className={prominent ? "mt-1 block text-xs font-bold leading-5 text-white/58 sm:text-sm" : "mt-0.5 block text-[0.68rem] font-bold text-white/48 sm:text-xs"}>من هنا تعدّل بيانات موقعك فقط. عملاؤك لن يروا هذه الصفحة.</span>
      </span>
      {prominent ? (
        <button type="button" onClick={onAcknowledge} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 text-xs font-black text-sky-100 transition-[background-color,border-color,color] hover:border-sky-300/35 hover:bg-sky-300/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151d] motion-reduce:transition-none">
          <Eye className="size-4" aria-hidden /> فهمت، لن يرى العملاء لوحة الإدارة
        </button>
      ) : null}
    </section>
  );
}

function LifecycleStatusCard({ subscription }: { subscription: NonNullable<DashboardViewModel["subscription"]> }) {
  const endDate = subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString("ar-EG") : "دائم";
  const tone = subscription.urgency;
  const toneClasses = tone === "danger" ? "border-red-300/24 bg-red-500/[0.08] text-red-100" : tone === "warning" ? "border-amber-300/24 bg-amber-300/[0.08] text-amber-100" : "border-emerald-300/18 bg-emerald-300/[0.07] text-emerald-100";
  const barClass = tone === "danger" ? "bg-red-300" : tone === "warning" ? "bg-amber-300" : "bg-emerald-300";
  return (
    <section className={`flex flex-col gap-2 rounded-[1rem] border px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${toneClasses}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10"><CalendarDays className="size-4" /></span>
        <span className="min-w-0">
          <span className="text-[0.68rem] font-black opacity-70">حالة الحساب</span>
          <span className="mx-1.5 text-[0.68rem] font-black opacity-70">·</span>
          <span className="text-xs font-black text-[#fff7e8]">{subscription.accountType} · {subscription.status}</span>
          <span className="mx-1.5 text-[0.68rem] font-black opacity-70">·</span>
          <span className="text-[0.68rem] font-bold opacity-70">{subscription.planName ?? "بدون باقة محددة"} · ينتهي: {endDate}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[0.68rem] font-black opacity-75">{subscription.daysRemaining === null ? "اشتراك دائم" : `متبقي ${subscription.daysRemaining} يوم`}</span>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/25 sm:w-24"><span className={`block h-full rounded-full ${barClass}`} style={{ width: `${subscription.progressPercent ?? 100}%` }} /></div>
        <span className="text-[0.68rem] font-black opacity-75">{subscription.progressPercent ?? 0}%</span>
        <Link href="/dashboard/billing" className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-xl bg-white/12 px-3 text-[0.68rem] font-black text-white no-underline transition hover:bg-white/18">{subscription.isExpired ? "تجديد الاشتراك" : subscription.isTrial ? "تفعيل الحساب" : "إدارة الاشتراك"}</Link>
      </div>
    </section>
  );
}

function CustomerMessageBanner({ message }: { message: DashboardViewModel["customerMessages"][number] }) { return <section className={customerMessageClass(message.tone)}><span className={activationDotClass(message.tone)} aria-hidden /><span className="min-w-0"><strong className="block truncate text-xs font-black sm:text-sm">{message.title}</strong>{message.body ? <small className="mt-0.5 block truncate text-[0.68rem] font-bold opacity-70">{message.body}</small> : null}</span></section>; }

function SetupStepRow({ item, index }: { item: DashboardViewModel["checklist"][number]; index: number }) { return <Link href={item.href} className={item.done ? "group grid min-h-14 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-emerald-300/16 bg-emerald-300/[0.055] px-3 py-2.5 no-underline transition hover:border-emerald-300/28 hover:bg-emerald-300/[0.09]" : "group grid min-h-14 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/10 bg-[#151a24] px-3 py-2.5 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b]"}><span className={item.done ? "grid size-9 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300" : "grid size-9 place-items-center rounded-2xl bg-white/[0.055] text-white/42 group-hover:text-[#f3cf73]"}>{item.done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}</span><span className={item.done ? "text-[0.7rem] font-black text-emerald-200/70" : "text-[0.7rem] font-black text-[#f3cf73]/75"}>{index}</span><span className="min-w-0"><span className={item.done ? "block truncate text-sm font-black text-[#dffbea]" : "block truncate text-sm font-black text-[#fff7e8]"}>{item.label}</span><span className={item.done ? "mt-0.5 block truncate text-[0.7rem] font-bold text-emerald-100/46" : "mt-0.5 block truncate text-[0.7rem] font-bold text-white/52"}>{item.description}</span></span><ArrowLeft className={item.done ? "size-4 text-emerald-200/35 transition group-hover:text-emerald-200" : "size-4 text-white/30 transition group-hover:text-[#f3cf73]"} aria-hidden /></Link>; }

function customerMessageClass(tone: BannerTone) { const base = "flex min-h-11 items-start gap-2 rounded-2xl border px-3 py-2"; if (tone === "success") return `${base} border-emerald-300/18 bg-emerald-300/[0.07] text-emerald-100`; if (tone === "danger") return `${base} border-red-300/18 bg-red-300/[0.07] text-red-100`; if (tone === "warning") return `${base} border-amber-300/18 bg-amber-300/[0.07] text-amber-100`; return `${base} border-sky-300/18 bg-sky-300/[0.07] text-sky-100`; }
function activationDotClass(tone: BannerTone) { if (tone === "success") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]"; if (tone === "danger") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-red-300 shadow-[0_0_12px_rgba(248,113,113,0.8)]"; if (tone === "info") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.75)]"; return "mt-1.5 size-1.5 shrink-0 animate-pulse rounded-full bg-[#f3cf73] shadow-[0_0_12px_rgba(243,207,115,0.85)]"; }
