"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Circle,
  ExternalLink,
  RotateCcw,
  X,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { ImmersiveOnboarding } from "@/components/ui/immersive-onboarding";

type BannerTone = "success" | "warning" | "danger" | "info";

const CHECKLIST_STORAGE_KEY = "frameid:onboarding-checklist";
const ONBOARDING_COMPLETED_KEY = "frameid:onboarding-completed";

const onboardingCopy: Record<string, { label: string; description: string }> = {
  package: { label: "الباقات والأسعار", description: "اكتب أسماء الباقات والأسعار والمميزات." },
  contact: { label: "بيانات التواصل", description: "اسم الاستوديو، الهاتف، واتساب، وروابطك." },
  avatar: { label: "صورة المصور", description: "صورة شخصية واضحة تمثل هويتك." },
  cover: { label: "صورة الغلاف", description: "صورة رئيسية قوية لموقعك." },
  album: { label: "معرض الصور", description: "أضف أعمالك الحقيقية داخل الألبومات." },
};

export function DashboardHomeClient({ siteUrl, checklist, nextStepHref, nextStepLabel, nextStepTitle, nextStepDescription, subscription, subscriptionExperience, customerMessages, photographerName, showWelcome }: DashboardViewModel & { showWelcome: boolean }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checklistHidden, setChecklistHidden] = useState(false);
  const onboardingResolvedRef = useRef(false);
  const router = useRouter();

  const onboardingItems = useMemo(
    () => checklist
      .filter((item) => onboardingCopy[item.id])
      .map((item) => ({ ...item, ...onboardingCopy[item.id] })),
    [checklist],
  );
  const doneCount = onboardingItems.filter((item) => item.done).length;
  const incompleteItems = onboardingItems.filter((item) => !item.done);
  const nextIncomplete = incompleteItems[0];

  useEffect(() => {
    if (onboardingResolvedRef.current) return;
    onboardingResolvedRef.current = true;

    try {
      const saved = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved) as { hidden?: boolean };
        setChecklistHidden(Boolean(preferences.hidden));
      }
    } catch {
    }

    if (showWelcome) {
      setShowOnboarding(true);
      router.replace("/dashboard", { scroll: false });
      return;
    }

    try {
      const completed = window.localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (!completed) {
        setShowOnboarding(true);
      }
    } catch {
    }
  }, [showWelcome, router]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
    } catch {
    }
  };

  return (
    <main className="customer-dashboard-home mx-auto grid w-full max-w-5xl gap-5 pb-4 sm:gap-6 lg:max-w-[1180px] lg:gap-6">
      {subscription && subscriptionExperience ? <LifecycleStatusCard subscription={subscription} experience={subscriptionExperience} /> : null}

      {customerMessages.length > 0 ? <section className="grid gap-2 lg:grid-cols-2">{customerMessages.map((message) => <CustomerMessageBanner key={message.id} message={message} />)}</section> : null}

      {checklistHidden ? (
        <button
          type="button"
          onClick={() => {
            setChecklistHidden(false);
            try {
              window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify({ hidden: false }));
            } catch {
            }
          }}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-2xl border border-white/10 bg-[#111720] px-3 text-xs font-black text-white/70 transition hover:border-amber-300/25 hover:text-[#f3cf73]"
        >
          <RotateCcw className="size-4" aria-hidden /> إظهار خطوات تجهيز الموقع
        </button>
      ) : (
        <div data-smart-tip="checklist">
          <ChecklistSection
            items={onboardingItems}
            doneCount={doneCount}
            onHide={() => {
              setChecklistHidden(true);
              try {
                window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify({ hidden: true }));
              } catch {
              }
            }}
          />
        </div>
      )}

      {nextIncomplete ? (
        <NextStepCard
          title={nextStepTitle}
          description={nextStepDescription}
          href={nextStepHref}
          label={nextStepLabel}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <Link href={nextStepHref} className="customer-dashboard-action-card inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20 sm:rounded-2xl sm:px-4 sm:text-sm">{nextStepLabel}<ArrowLeft className="size-3.5 sm:size-4" aria-hidden /></Link>
        <Link href={siteUrl} target="_blank" className="customer-dashboard-action-card inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#151a24] px-3 text-xs font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white sm:rounded-2xl sm:px-4 sm:text-sm"><ExternalLink className="size-3.5 sm:size-4" aria-hidden /> افتح الموقع كعميل</Link>
      </div>

      {showOnboarding ? (
        <ImmersiveOnboarding onComplete={completeOnboarding} photographerName={photographerName} />
      ) : null}
    </main>
  );
}

function ChecklistSection({
  items,
  doneCount,
  onHide,
}: {
  items: Array<{ id: string; done: boolean; href: string; label: string; description: string }>;
  doneCount: number;
  onHide: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-[#111720] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_18px_48px_rgba(0,0,0,0.18)] sm:rounded-[1.25rem]">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.035))] p-3 sm:p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-amber-300/18 bg-amber-300/12 text-[#f3cf73] shadow-sm sm:size-10 sm:rounded-xl">
            <CheckCircle2 className="size-4.5 sm:size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-[#fff7e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-base">خطوات تجهيز موقعك</strong>
            <small className="mt-0.5 block truncate text-[0.62rem] font-bold text-white/50 sm:text-[0.68rem]">{doneCount} من {items.length} خطوات مكتملة</small>
          </div>
        </div>
        <button
          type="button"
          onClick={onHide}
          aria-label="إخفاء خطوات التجهيز"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white sm:size-9 sm:rounded-xl"
        >
          <X className="size-3.5 sm:size-4" aria-hidden />
        </button>
      </header>
      <div className="grid gap-2 p-3 sm:grid-cols-2 sm:gap-3 lg:gap-3">
        {items.map((item) => <ChecklistItem key={item.id} item={item} />)}
      </div>
    </section>
  );
}

function ChecklistItem({ item }: { item: { id: string; done: boolean; href: string; label: string; description: string } }) {
  return (
    <Link
      href={item.href}
      className={item.done
        ? "group flex min-h-12 items-center gap-2.5 rounded-xl border border-emerald-300/16 bg-emerald-300/[0.055] px-2.5 py-2 no-underline transition hover:border-emerald-300/28 hover:bg-emerald-300/[0.09] sm:rounded-2xl sm:px-3 sm:py-2.5"
        : "group flex min-h-12 items-center gap-2.5 rounded-xl border border-white/10 bg-[#151a24] px-2.5 py-2 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] sm:rounded-2xl sm:px-3 sm:py-2.5"
      }
    >
      <span className={item.done
        ? "grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-300/12 text-emerald-300 sm:size-9 sm:rounded-xl"
        : "grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-white/42 group-hover:text-[#f3cf73] sm:size-9 sm:rounded-xl"
      }>
        {item.done ? <CheckCircle2 className="size-4 sm:size-5" aria-hidden /> : <Circle className="size-4 sm:size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={item.done ? "block truncate text-xs font-black text-[#dffbea] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-sm" : "block truncate text-xs font-black text-[#fff7e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-sm"}>{item.label}</span>
        <span className={item.done ? "mt-0.5 block truncate text-[0.62rem] font-bold text-emerald-100/46 sm:text-[0.7rem]" : "mt-0.5 block truncate text-[0.62rem] font-bold text-white/50 sm:text-[0.7rem]"}>{item.description}</span>
      </span>
      <ChevronLeft className={item.done ? "size-3.5 text-emerald-200/35 transition group-hover:text-emerald-200 sm:size-4" : "size-3.5 text-white/30 transition group-hover:text-[#f3cf73] sm:size-4"} aria-hidden />
    </Link>
  );
}

function NextStepCard({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-[linear-gradient(135deg,rgba(243,207,115,0.12),rgba(255,255,255,0.04)),#131820] p-3 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:shadow-[0_18px_48px_rgba(243,207,115,0.08)] sm:rounded-[1.25rem] sm:p-5"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3cf73] text-[#17120a] shadow-lg shadow-amber-500/20 transition group-hover:scale-105 sm:size-12 sm:rounded-2xl">
        <ArrowLeft className="size-4 sm:size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-[#f3cf73]">الخطوة الجاية</span>
        <span className="mt-0.5 block text-sm font-black text-[#fff7e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-lg">{title}</span>
        <span className="mt-0.5 block text-xs font-bold text-white/55 sm:text-sm">{description}</span>
      </span>
      <span className="hidden shrink-0 rounded-xl bg-[#f3cf73] px-3 py-1.5 text-xs font-black text-[#17120a] sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
        {label}
      </span>
    </Link>
  );
}

function LifecycleStatusCard({
  subscription,
  experience,
}: {
  subscription: NonNullable<DashboardViewModel["subscription"]>;
  experience: NonNullable<DashboardViewModel["subscriptionExperience"]>;
}) {
  if (!experience.message.enabled && !experience.timer.enabled && !experience.action.visible) {
    return null;
  }
  const endDate = subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString("ar-EG") : "دائم";
  const tone =
    experience.message.tone === "danger"
      ? "danger"
      : experience.message.tone === "warning"
        ? "warning"
        : experience.message.tone === "success"
          ? "success"
          : subscription.urgency;
  const toneClasses = tone === "danger" ? "border-red-300/20 bg-red-500/[0.06]" : tone === "warning" ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-emerald-300/16 bg-emerald-300/[0.05]";
  const toneText = tone === "danger" ? "text-red-100" : tone === "warning" ? "text-amber-100" : "text-emerald-100";
  const barClass = tone === "danger" ? "bg-red-400" : tone === "warning" ? "bg-amber-400" : "bg-emerald-400";
  const buttonClass = tone === "danger" ? "bg-red-400 hover:bg-red-300 text-white" : tone === "warning" ? "bg-amber-400 hover:bg-amber-300 text-[#17120a]" : "bg-emerald-400 hover:bg-emerald-300 text-[#17120a]";
  const daysText =
    experience.timer.enabled && experience.timer.daysRemaining !== null
      ? `متبقي ${experience.timer.daysRemaining} يوم`
      : subscription.daysRemaining === null
        ? "اشتراك دائم"
        : `متبقي ${subscription.daysRemaining} يوم`;
  return (
    <section className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-2xl sm:gap-3 sm:p-2.5 ${toneClasses}`}>
      <span className={`grid size-7 shrink-0 place-items-center rounded-md bg-white/8 ${toneText} sm:size-8 sm:rounded-lg`}>
        <CalendarDays className="size-3.5 sm:size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
          <span className="text-[0.65rem] font-black text-[#fff7e8] sm:text-xs">{experience.message.title}</span>
          <span className="mx-1 text-[0.55rem] font-bold text-white/30">·</span>
          <span className="text-[0.6rem] font-bold text-white/45">{subscription.planName ?? subscription.accountType}</span>
          <span className="mx-1 text-[0.55rem] font-bold text-white/25">·</span>
          <span className="text-[0.6rem] font-bold text-white/50">{daysText}</span>
          <span className="mx-1 text-[0.55rem] font-bold text-white/25">·</span>
          <span className="text-[0.6rem] font-bold text-white/40">ينتهي: {endDate}</span>
        </div>
        {experience.message.description ? (
          <p className="mt-0.5 text-[0.6rem] font-bold leading-4 text-white/55 sm:text-[0.65rem]">
            {experience.message.description}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-black/30 sm:w-20 sm:h-1.5">
            <span className={`block h-full rounded-full transition-all ${barClass}`} style={{ width: `${subscription.progressPercent ?? 100}%` }} />
          </div>
          <span className={`text-[0.6rem] font-black ${toneText}`}>{subscription.progressPercent ?? 0}%</span>
        </div>
        {experience.action.visible && experience.action.href ? (
          <Link
            href={experience.action.href}
            target={experience.action.target}
            className={`inline-flex min-h-7 shrink-0 items-center justify-center rounded-md px-2.5 text-[0.6rem] font-black no-underline transition sm:min-h-8 sm:rounded-lg sm:px-3 sm:text-xs ${buttonClass}`}
          >
            {experience.action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function CustomerMessageBanner({ message }: { message: DashboardViewModel["customerMessages"][number] }) {
  return (
    <section className={customerMessageClass(message.tone)}>
      <span className={activationDotClass(message.tone)} aria-hidden />
      <span className="min-w-0">
        <strong className="block truncate text-xs font-black sm:text-sm">{message.title}</strong>
        {message.body ? <small className="mt-0.5 block truncate text-[0.68rem] font-bold opacity-70">{message.body}</small> : null}
      </span>
    </section>
  );
}

function customerMessageClass(tone: BannerTone) {
  const base = "flex min-h-11 items-start gap-2 rounded-2xl border px-3 py-2";
  if (tone === "success") return `${base} border-emerald-300/18 bg-emerald-300/[0.07] text-emerald-100`;
  if (tone === "danger") return `${base} border-red-300/18 bg-red-300/[0.07] text-red-100`;
  if (tone === "info") return `${base} border-sky-300/18 bg-sky-300/[0.07] text-sky-100`;
  return `${base} border-amber-300/18 bg-amber-300/[0.07] text-amber-100`;
}

function activationDotClass(tone: BannerTone) {
  if (tone === "success") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]";
  if (tone === "danger") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-red-300 shadow-[0_0_12px_rgba(248,113,113,0.8)]";
  if (tone === "info") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.75)]";
  return "mt-1.5 size-1.5 shrink-0 animate-pulse rounded-full bg-[#f3cf73] shadow-[0_0_12px_rgba(243,207,115,0.85)]";
}
