"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  LayoutDashboard,
  Package,
  Phone,
  Sparkles,
  Zap,
} from "lucide-react";

const TOTAL_STEPS = 5;
const CARD_EXIT_MS = 280;
const OVERLAY_EXIT_MS = 500;

const cardColors = [
  { glow: "rgba(243,207,115,0.25)", accent: "#f3cf73", spotlight: "30% 40%" },
  { glow: "rgba(168,85,247,0.22)", accent: "#a855f7", spotlight: "50% 35%" },
  { glow: "rgba(52,211,153,0.22)", accent: "#34d399", spotlight: "70% 45%" },
  { glow: "rgba(99,102,241,0.20)", accent: "#6366f1", spotlight: "40% 50%" },
  { glow: "rgba(243,207,115,0.28)", accent: "#f3cf73", spotlight: "50% 40%" },
];

export function ImmersiveOnboarding({ onComplete, photographerName }: { onComplete: () => void; photographerName?: string }) {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);

  const clearAllTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("frameid:onboarding", { detail: true }));
    return () => {
      mountedRef.current = false;
      clearAllTimers();
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new CustomEvent("frameid:onboarding", { detail: false }));
    };
  }, [clearAllTimers]);

  const advanceStep = useCallback(() => {
    if (transitioning || exiting) return;
    if (step >= TOTAL_STEPS - 1) {
      setExiting(true);
      addTimer(() => {
        if (!mountedRef.current) return;
        onComplete();
      }, OVERLAY_EXIT_MS);
      addTimer(() => {
        if (!mountedRef.current) return;
        router.push("/dashboard/services");
      }, OVERLAY_EXIT_MS + 50);
      return;
    }
    setTransitioning(true);
    addTimer(() => {
      if (!mountedRef.current) return;
      setTransitioning(false);
      setStep((s) => s + 1);
    }, CARD_EXIT_MS);
  }, [step, transitioning, exiting, onComplete, router, addTimer]);

  const goBack = useCallback(() => {
    if (transitioning || exiting || step === 0) return;
    setTransitioning(true);
    addTimer(() => {
      if (!mountedRef.current) return;
      setTransitioning(false);
      setStep((s) => s - 1);
    }, CARD_EXIT_MS);
  }, [step, transitioning, exiting, addTimer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") advanceStep();
      if (e.key === "ArrowLeft") goBack();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceStep, goBack]);

  const currentColor = cardColors[step];

  return (
    <div
      className={`fixed inset-0 z-50 ${exiting ? "io-overlay-exit" : "io-overlay-enter"}`}
      dir="rtl"
    >
      <div className="io-backdrop absolute inset-0 bg-[#0b0d12]/60" />

      <IoSpotlight color={currentColor.glow} position={currentColor.spotlight} />
      <IoAmbientBackground step={step} />

      <div className="relative flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className={`w-full max-w-md sm:max-w-lg ${transitioning || exiting ? "io-card-exit" : "io-card-enter"}`} key={step}>
          <IoProgressCapsule step={step} total={TOTAL_STEPS} accentColor={currentColor.accent} />
          <IoCardGlass step={step} accentColor={currentColor.accent} glowColor={currentColor.glow}>
            {step === 0 ? <IoCardWelcome photographerName={photographerName} /> : null}
            {step === 1 ? <IoCardContrast /> : null}
            {step === 2 ? <IoCardReady /> : null}
            {step === 3 ? <IoCardGuided /> : null}
            {step === 4 ? <IoCardStart onNext={advanceStep} /> : null}
          </IoCardGlass>
          <div key={`nav-${step}`} className="io-stagger mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-white/50 transition hover:bg-white/[0.08] hover:text-white/80 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft className="size-4 rotate-180" aria-hidden />
              السابق
            </button>
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={advanceStep}
                className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5"
                style={{ background: currentColor.accent, boxShadow: `0 8px 24px ${currentColor.glow}` }}
              >
                التالي
                <ArrowLeft className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function IoProgressCapsule({ step, total, accentColor }: { step: number; total: number; accentColor: string }) {
  return (
    <div className="io-stagger mb-5 flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="io-capsule rounded-full"
          style={{
            width: i === step ? 32 : 8,
            height: 8,
            background: i === step ? accentColor : i < step ? accentColor : "rgba(255,255,255,0.12)",
            opacity: i === step ? 1 : i < step ? 0.6 : 0.4,
            boxShadow: i === step ? `0 0 12px ${accentColor}` : "none",
            willChange: "width, background, opacity",
          }}
        />
      ))}
    </div>
  );
}

function IoSpotlight({ color, position }: { color: string; position: string }) {
  const [x, y] = position.split(" ");
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 transition-all duration-700 ease-out sm:h-[700px] sm:w-[700px]"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, left: x, top: y, willChange: "left, top, background" }}
      />
    </div>
  );
}

function IoCardGlass({ glowColor, children }: { step: number; accentColor: string; glowColor: string; children: React.ReactNode }) {
  return (
    <div
      className="io-glass-card relative overflow-hidden rounded-[1.5rem] border border-white/[0.12] p-5 sm:rounded-[1.75rem] sm:p-7"
      style={{
        background: `linear-gradient(145deg, rgba(17,23,32,0.92) 0%, rgba(12,16,22,0.96) 100%)`,
        boxShadow: `0 24px 48px rgba(0,0,0,0.45), 0 0 48px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-white/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 50%)` }} />
      {children}
    </div>
  );
}

function IoCardWelcome({ photographerName }: { photographerName?: string }) {
  const greeting = photographerName ? `أهلاً يا ${photographerName}` : "أهلاً بيك";
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <div className="io-stagger io-icon-entrance mb-4 relative">
        <div className="absolute inset-0 rounded-full bg-[#f3cf73]/20 io-glow-pulse" />
        <div className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#f3cf73]/20 to-[#f3cf73]/5 shadow-[0_0_24px_rgba(243,207,115,0.25)] sm:size-20 sm:rounded-3xl">
          <Sparkles className="size-8 text-[#f3cf73] sm:size-9" aria-hidden />
        </div>
      </div>
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        {greeting} 👋
      </h2>
      <p className="io-stagger mt-2 max-w-sm text-sm leading-6 font-bold text-white/85 sm:text-base">
        موقعك جاهز بالفعل… فاضل بس تضبطه على ذوقك.
      </p>
    </div>
  );
}

function IoCardContrast() {
  return (
    <div className="py-1">
      <h2 className="io-stagger text-center text-xl font-black text-[#fff7e8] sm:text-2xl">
        دي لوحة التحكم بتاعتك
      </h2>
      <p className="io-stagger mt-1.5 text-center text-sm leading-6 font-bold text-white/85 sm:text-base">
        هنا بتعدل كل حاجة… والعميل بيشوف النتيجة على موقعه.
      </p>
      <div className="io-stagger mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className="io-scene-left rounded-xl border border-purple-300/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.10),rgba(255,255,255,0.02))] p-3 text-center sm:rounded-2xl sm:p-4">
          <div className="mx-auto mb-2 grid size-10 place-items-center rounded-xl bg-purple-300/15 text-purple-300 sm:size-11 sm:rounded-2xl">
            <LayoutDashboard className="size-5" aria-hidden />
          </div>
          <p className="text-xs font-black text-purple-200 sm:text-sm">لوحة التحكم</p>
          <p className="mt-1 text-[0.6rem] font-bold text-white/40 sm:text-[0.65rem]">أدواتك الخاصة</p>
          <span className="io-tag mt-2 inline-block rounded-full bg-purple-300/15 px-2 py-0.5 text-[0.55rem] font-black text-purple-200/80">
            إنت هنا
          </span>
        </div>

        <div className="io-arrow flex flex-col items-center gap-1 px-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/25">
            <path d="M18 12H6M6 12L10 8M6 12L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[0.5rem] font-black text-white/30">العميل</span>
        </div>

        <div className="io-scene-right rounded-xl border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.10),rgba(255,255,255,0.02))] p-3 text-center sm:rounded-2xl sm:p-4">
          <div className="mx-auto mb-2 grid size-10 place-items-center rounded-xl bg-emerald-300/15 text-emerald-300 sm:size-11 sm:rounded-2xl">
            <Eye className="size-5" aria-hidden />
          </div>
          <p className="text-xs font-black text-emerald-200 sm:text-sm">الموقع العام</p>
          <p className="mt-1 text-[0.6rem] font-bold text-white/40 sm:text-[0.65rem]">اللي يشوفه العميل</p>
          <span className="io-tag mt-2 inline-block rounded-full bg-emerald-300/15 px-2 py-0.5 text-[0.55rem] font-black text-emerald-200/80">
            الموقع
          </span>
        </div>
      </div>
    </div>
  );
}

function IoCardReady() {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <div className="io-stagger relative mb-4">
        <div className="absolute inset-0 rounded-full bg-emerald-400/15 io-glow-pulse-green" />
        <div className="relative grid size-16 place-items-center rounded-full bg-emerald-300/15 shadow-[0_0_24px_rgba(52,211,153,0.25)] sm:size-20">
          <div className="io-check-draw grid size-10 place-items-center rounded-full bg-emerald-300/25 sm:size-12">
            <Check className="size-6 text-emerald-300 sm:size-7" aria-hidden />
          </div>
        </div>
      </div>
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        موقعك شغال بالفعل ✅
      </h2>
      <p className="io-stagger mt-1.5 max-w-sm text-sm leading-6 font-bold text-white/85 sm:text-base">
        إنت مش بتبدأ من الصفر… الموقع جاهز، وإنت بس هتضيف لمستك.
      </p>
    </div>
  );
}

function IoCardGuided() {
  const steps = [
    { label: "ظبط الباقات والأسعار", color: "#f3cf73", icon: Package },
    { label: "حط رقمك وروابطك", color: "#6366f1", icon: Phone },
    { label: "ارفع أحسن شغلك", color: "#34d399", icon: Sparkles },
  ];
  return (
    <div className="py-1 text-center">
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        مش لازم تعمل كل حاجة مرة واحدة
      </h2>
      <p className="io-stagger mt-1.5 text-sm leading-6 font-bold text-white/85 sm:text-base">
        امشي خطوة خطوة… وإحنا هنوصلك لموقع جاهز في دقائق.
      </p>
      <div className="mt-4 grid gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="io-guided-step flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 sm:rounded-2xl sm:p-3"
              style={{ animationDelay: `${0.35 + i * 0.12}s` }}
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 sm:rounded-xl"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-black text-white/75">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IoCardStart({ onNext }: { onNext: () => void }) {
  const items = [
    { icon: Package, label: "ظبط الباقات والأسعار", color: "#f3cf73" },
    { icon: Phone, label: "حط رقمك وروابطك", color: "#6366f1" },
    { icon: Sparkles, label: "ارفع أحسن شغلك", color: "#34d399" },
  ];
  return (
    <div className="py-1 text-center">
      <div className="io-stagger mb-3">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#f3cf73]/20 to-[#f3cf73]/5 shadow-[0_0_24px_rgba(243,207,115,0.25)] sm:size-14 sm:rounded-3xl">
          <Zap className="size-6 text-[#f3cf73] sm:size-7" aria-hidden />
        </div>
      </div>
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        يلا نجهز موقعك
      </h2>
      <p className="io-stagger mt-1.5 text-sm leading-6 font-bold text-white/85">
        ابدأ بالباقات لأنها أول حاجة العميل هيشوفها.
      </p>
      <div className="mt-4 grid gap-1.5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="io-start-item flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 sm:rounded-2xl sm:gap-3 sm:p-3"
              style={{ animationDelay: `${0.35 + i * 0.1}s` }}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg sm:size-8 sm:rounded-xl"
                style={{ background: `${item.color}18`, color: item.color }}
              >
                <Icon className="size-3.5 sm:size-4" aria-hidden />
              </span>
              <span className="text-sm font-black text-white/75">✔ {item.label}</span>
            </div>
          );
        })}
      </div>
      <p className="io-stagger mt-3 text-xs font-bold text-white/75 sm:text-sm" style={{ animationDelay: "0.8s" }}>
        ٣ خطوات بس… وبعدها ابعت موقعك لأي عميل.
      </p>
      <button
        type="button"
        onClick={onNext}
        className="io-start-btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#e8c15e] py-3 text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 hover:shadow-amber-500/35 sm:py-3.5 sm:text-base"
        style={{ animationDelay: "0.9s" }}
      >
        يلا نبدأ بالباقات
        <ArrowLeft className="size-4 sm:size-5" aria-hidden />
      </button>
    </div>
  );
}

function IoAmbientBackground({ step }: { step: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 transition-colors duration-[800ms] ease-out sm:h-[600px] sm:w-[600px]"
        style={{ background: `radial-gradient(circle, ${cardColors[step].glow} 0%, transparent 70%)`, willChange: "background" }}
      />
    </div>
  );
}
