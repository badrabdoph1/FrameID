"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Copy,
  ExternalLink,
  Eye,
  LayoutDashboard,
  RotateCcw,
  X,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";

type BannerTone = "success" | "warning" | "danger" | "info";

const ONBOARDING_STORAGE_KEY = "frameid:onboarding-completed";
const CHECKLIST_STORAGE_KEY = "frameid:onboarding-checklist";

const onboardingCopy: Record<string, { label: string; description: string }> = {
  package: { label: "الباقات والأسعار", description: "اكتب أسماء الباقات والأسعار والمميزات." },
  contact: { label: "بيانات التواصل", description: "اسم الاستوديو، الهاتف، واتساب، وروابطك." },
  avatar: { label: "صورة المصور", description: "صورة شخصية واضحة تمثل هويتك." },
  cover: { label: "صورة الغلاف", description: "صورة رئيسية قوية لموقعك." },
  album: { label: "معرض الصور", description: "أضف أعمالك الحقيقية داخل الألبومات." },
};

export function DashboardHomeClient({ siteUrl, statusLabel, checklist, lastModified, nextStepHref, nextStepLabel, nextStepTitle, nextStepDescription, subscription, customerMessages, heroImageUrl, photographerName, isPublished }: DashboardViewModel) {
  const [copied, setCopied] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [checklistHidden, setChecklistHidden] = useState(false);

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
    try {
      const completed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!completed) {
        setShowOnboarding(true);
      }
      const saved = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved) as { hidden?: boolean };
        setChecklistHidden(Boolean(preferences.hidden));
      }
    } catch {
    }
  }, []);

  const completeOnboarding = () => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
    }
    setShowOnboarding(false);
  };

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="customer-dashboard-home mx-auto grid w-full max-w-5xl gap-5 pb-4 sm:gap-6 lg:max-w-[1180px] lg:gap-6">
      {subscription?.showLifecycleCard ? <LifecycleStatusCard subscription={subscription} /> : null}

      {customerMessages.length > 0 ? <section className="grid gap-2 lg:grid-cols-2">{customerMessages.map((message) => <CustomerMessageBanner key={message.id} message={message} />)}</section> : null}

      <SiteIdentityCard
        siteUrl={siteUrl}
        statusLabel={statusLabel}
        isPublished={isPublished}
        lastModified={lastModified}
        photographerName={photographerName}
        heroImageUrl={heroImageUrl}
        copied={copied}
        onCopy={copySiteUrl}
      />

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
      )}

      {nextIncomplete ? (
        <NextStepCard
          title={nextStepTitle}
          description={nextStepDescription}
          href={nextStepHref}
          label={nextStepLabel}
        />
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 lg:gap-4">
        <Link href={nextStepHref} className="customer-dashboard-action-card inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20">{nextStepLabel}<ArrowLeft className="size-4" aria-hidden /></Link>
        <Link href={siteUrl} target="_blank" className="customer-dashboard-action-card inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white"><ExternalLink className="size-4" aria-hidden /> افتح الموقع كعميل</Link>
      </div>

      {showOnboarding ? (
        <OnboardingWizard
          step={onboardingStep}
          setStep={setOnboardingStep}
          onComplete={completeOnboarding}
          siteUrl={siteUrl}
        />
      ) : null}
    </main>
  );
}

function SiteIdentityCard({
  siteUrl,
  statusLabel,
  isPublished,
  lastModified,
  photographerName,
  heroImageUrl,
  copied,
  onCopy,
}: {
  siteUrl: string;
  statusLabel: string;
  isPublished: boolean;
  lastModified: string;
  photographerName: string;
  heroImageUrl: string | null;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/12 bg-[linear-gradient(135deg,#121720_0%,#0f1419_100%)] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {heroImageUrl ? (
        <div className="absolute inset-0 opacity-[0.07]">
          <Image src={heroImageUrl} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      ) : null}
      
      <div className="relative">
        <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(243,207,115,0.12),rgba(243,207,115,0.04))] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-amber-300/15 text-[#f3cf73] shadow-[0_0_12px_rgba(243,207,115,0.2)]">
              <LayoutDashboard className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#fff7e8] sm:text-sm">أنت الآن في لوحة التحكم</p>
              <p className="mt-0.5 text-[0.68rem] font-bold text-white/45 sm:text-xs">من هنا تعدّل موقعك. عملاؤك لن يروا هذه الصفحة.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-6">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            {heroImageUrl ? (
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-lg sm:h-20 sm:w-32 sm:rounded-2xl">
                <Image src={heroImageUrl} alt="" fill sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
              </div>
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300/20 to-amber-300/5 text-[#f3cf73] shadow-lg sm:size-16 sm:rounded-2xl">
                <Eye className="size-6 sm:size-7" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black text-[#fff7e8] sm:text-xl lg:text-2xl">{photographerName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className={isPublished ? "inline-flex items-center gap-1 rounded-full bg-emerald-300/12 px-2 py-0.5 text-[0.68rem] font-black text-emerald-300 sm:px-2.5" : "inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2 py-0.5 text-[0.68rem] font-black text-[#f3cf73] sm:px-2.5"}>
                  <span className={isPublished ? "size-1.5 rounded-full bg-emerald-300" : "size-1.5 rounded-full bg-[#f3cf73]"} />
                  {statusLabel}
                </span>
                <span className="text-[0.68rem] font-bold text-white/45 sm:text-xs">آخر تعديل {lastModified}</span>
              </div>
              <p dir="ltr" className="mt-2 truncate text-xs font-black text-[#f3cf73]/70 sm:text-sm lg:text-base">{siteUrl}</p>
            </div>
          </div>

          <div className="grid gap-2 sm:flex sm:justify-end sm:gap-3">
            <Link
              href={siteUrl}
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#e8c15e] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-amber-500/30 sm:min-h-12 sm:px-5"
            >
              <Eye className="size-4" aria-hidden />
              <span className="hidden sm:inline">شاهد موقعك كما يراه العميل</span>
              <span className="sm:hidden">شاهد موقعك</span>
            </Link>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.045] px-4 text-sm font-black text-white/78 transition hover:border-amber-300/24 hover:bg-white/[0.075] hover:text-white sm:min-h-12 sm:px-5"
            >
              {copied ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              <span>{copied ? "اتنسخ" : "انسخ الرابط"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
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
    <section className="overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#111720] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_18px_48px_rgba(0,0,0,0.18)]">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.035))] p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/12 text-[#f3cf73] shadow-sm">
            <CheckCircle2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-[#fff7e8] sm:text-base">خطوات تجهيز موقعك</strong>
            <small className="mt-0.5 block truncate text-[0.68rem] font-bold text-white/55 sm:text-xs">{doneCount} من {items.length} خطوات مكتملة</small>
          </div>
        </div>
        <button
          type="button"
          onClick={onHide}
          aria-label="إخفاء خطوات التجهيز"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>
      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:gap-3">
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
        ? "group flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-300/16 bg-emerald-300/[0.055] px-3 py-2.5 no-underline transition hover:border-emerald-300/28 hover:bg-emerald-300/[0.09]"
        : "group flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#151a24] px-3 py-2.5 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b]"
      }
    >
      <span className={item.done
        ? "grid size-9 shrink-0 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300"
        : "grid size-9 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-white/42 group-hover:text-[#f3cf73]"
      }>
        {item.done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={item.done ? "block truncate text-sm font-black text-[#dffbea]" : "block truncate text-sm font-black text-[#fff7e8]"}>{item.label}</span>
        <span className={item.done ? "mt-0.5 block truncate text-[0.7rem] font-bold text-emerald-100/46" : "mt-0.5 block truncate text-[0.7rem] font-bold text-white/52"}>{item.description}</span>
      </span>
      <ChevronLeft className={item.done ? "size-4 text-emerald-200/35 transition group-hover:text-emerald-200" : "size-4 text-white/30 transition group-hover:text-[#f3cf73]"} aria-hidden />
    </Link>
  );
}

function NextStepCard({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[1.25rem] border border-amber-300/20 bg-[linear-gradient(135deg,rgba(243,207,115,0.12),rgba(255,255,255,0.04)),#131820] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/35 hover:shadow-[0_18px_48px_rgba(243,207,115,0.08)] sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f3cf73] text-[#17120a] shadow-lg shadow-amber-500/20 transition group-hover:scale-105">
        <ArrowLeft className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-[#f3cf73]">الخطوة الجاية</span>
        <span className="mt-0.5 block text-base font-black text-[#fff7e8] sm:text-lg">{title}</span>
        <span className="mt-1 block text-sm font-bold text-white/55">{description}</span>
      </span>
      <span className="hidden shrink-0 rounded-2xl bg-[#f3cf73] px-4 py-2 text-sm font-black text-[#17120a] sm:block">
        {label}
      </span>
    </Link>
  );
}

function OnboardingWizard({
  step,
  setStep,
  onComplete,
  siteUrl,
}: {
  step: number;
  setStep: (step: number) => void;
  onComplete: () => void;
  siteUrl: string;
}) {
  const steps = [
    {
      title: "أهلاً بيك في FrameID",
      body: "FrameID هو موقعك الخاص تعرض فيه شغلك للعملاء. صفحة واحدة فيها صورك، باقاتك، وطريقة التواصل معاك.",
    },
    {
      title: "إيه اللي هتعمله هنا؟",
      body: "من لوحة التحكم دي هتضيف باقاتك وأسعارك، ترفع صورك، وتحط بيانات التواصل. كل حاجة سهلة ومنظمة.",
    },
    {
      title: "إيه اللي هيشوفه العميل؟",
      body: "العميل هيشوف صفحة واحدة فيها كل حاجة عنك. مش هيشوف لوحة التحكم دي أبداً.",
    },
    {
      title: "ابدأ منين؟",
      body: "أول خطوة: اكتب باقاتك وأسعارك. بعدها كمّل باقي الخطوات بالترتيب.",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#131820] shadow-2xl">
        <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),transparent)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#f3cf73]">خطوة {step + 1} من {steps.length}</span>
            <button
              type="button"
              onClick={onComplete}
              className="grid size-8 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="تخطي"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-2 flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={i <= step ? "h-1 flex-1 rounded-full bg-[#f3cf73]" : "h-1 flex-1 rounded-full bg-white/10"}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-black text-[#fff7e8]">{current.title}</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-white/60">{current.body}</p>

          {step === 2 ? (
            <Link
              href={siteUrl}
              target="_blank"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-black text-[#f3cf73] no-underline transition hover:bg-amber-300/16"
            >
              <Eye className="size-4" aria-hidden />
              شاهد مثال لموقع العميل
            </Link>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-white/8 p-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/70 transition hover:bg-white/[0.08]"
            >
              السابق
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => isLast ? onComplete() : setStep(step + 1)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a]"
          >
            {isLast ? "يلا نبدأ" : "التالي"}
            {isLast ? null : <ChevronLeft className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
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
