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

const ambientColors = [
  "rgba(243,207,115,0.10)",
  "rgba(99,102,241,0.08)",
  "rgba(52,211,153,0.08)",
  "rgba(168,85,247,0.07)",
  "rgba(243,207,115,0.12)",
];

const accentColors = [
  "#f3cf73",
  "#818cf8",
  "#34d399",
  "#a855f7",
  "#f3cf73",
];

export function ImmersiveOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const advanceStep = useCallback(() => {
    if (transitioning) return;
    if (step >= TOTAL_STEPS - 1) {
      setExiting(true);
      timerRef.current = setTimeout(() => {
        onComplete();
        router.push("/dashboard/services");
      }, 650);
      return;
    }
    setTransitioning(true);
    timerRef.current = setTimeout(() => {
      setStep((s) => s + 1);
      timerRef.current = setTimeout(() => setTransitioning(false), 50);
    }, CARD_EXIT_MS);
  }, [step, transitioning, onComplete, router]);

  const skip = useCallback(() => {
    setExiting(true);
    timerRef.current = setTimeout(() => onComplete(), 650);
  }, [onComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowLeft" || e.key === "Enter") advanceStep();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip, advanceStep]);

  return (
    <div
      className={`fixed inset-0 z-50 ${exiting ? "io-overlay-exit" : "io-overlay-enter"}`}
      dir="rtl"
    >
      <div className="absolute inset-0 bg-[#0b0d12]/80 backdrop-blur-2xl" />

      <IoAmbientBackground step={step} />
      <IoFloatingShapes />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className={`w-full max-w-lg ${transitioning || exiting ? "io-card-exit" : "io-card-enter"}`} key={step}>
          <IoProgressDots step={step} total={TOTAL_STEPS} />
          <IoCardGlass step={step}>
            {step === 0 ? <IoCardWelcome /> : null}
            {step === 1 ? <IoCardContrast /> : null}
            {step === 2 ? <IoCardReady /> : null}
            {step === 3 ? <IoCardGuided /> : null}
            {step === 4 ? <IoCardStart onNext={advanceStep} /> : null}
          </IoCardGlass>
          {step < TOTAL_STEPS - 1 ? (
            <div key={`nav-${step}`} className="io-stagger mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={skip}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-white/40 transition hover:bg-white/[0.08] hover:text-white/70"
              >
                تخطي
              </button>
              <button
                type="button"
                onClick={advanceStep}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#f3cf73] px-5 py-2.5 text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a]"
              >
                التالي
                <ArrowLeft className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <IoScanLine />
    </div>
  );
}

function IoProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-2" key={`dots-${step}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="io-dot rounded-full transition-all duration-500"
          style={{
            width: i === step ? 28 : 7,
            height: 7,
            background: i === step ? accentColors[step] : i < step ? accentColors[i] : "rgba(255,255,255,0.15)",
            boxShadow: i === step ? `0 0 14px ${accentColors[step]}` : "none",
            animationDelay: i === step ? "0.3s" : "0s",
          }}
        />
      ))}
    </div>
  );
}

function IoCardGlass({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div
      className="io-glass-card relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] p-6 sm:p-8"
      style={{
        background: `linear-gradient(145deg, rgba(17,23,32,0.94) 0%, rgba(15,20,25,0.97) 100%)`,
        boxShadow: `0 32px 80px rgba(0,0,0,0.4), 0 0 60px ${ambientColors[step]}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-200/40 to-transparent" />
      {children}
    </div>
  );
}

function IoCardWelcome() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="io-stagger io-icon-entrance mb-6 relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#f3cf73]/20 blur-xl" />
        <div className="relative grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-[#f3cf73]/20 to-[#f3cf73]/5 shadow-[0_0_40px_rgba(243,207,115,0.25)] sm:size-24 sm:rounded-[1.75rem]">
          <Sparkles className="size-9 text-[#f3cf73] sm:size-11" aria-hidden />
        </div>
      </div>
      <h2 className="io-stagger text-2xl font-black text-[#fff7e8] sm:text-3xl">
        أهلاً بيك في FrameID
      </h2>
      <p className="io-stagger mt-3 max-w-sm text-sm leading-7 text-white/50 sm:text-base">
        موقعك جاهز. من هنا هتخصصه زي ما تحب.
      </p>
    </div>
  );
}

function IoCardContrast() {
  return (
    <div className="py-2">
      <h2 className="io-stagger text-center text-xl font-black text-[#fff7e8] sm:text-2xl">
        إنت هنا بس
      </h2>
      <p className="io-stagger mt-2 text-center text-sm leading-7 text-white/45 sm:text-base">
        اللي هنا بتاعك. اللي برة ده اللي العميل يشوفه.
      </p>
      <div className="io-stagger mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className="io-scene-left rounded-2xl border border-amber-300/15 bg-[linear-gradient(135deg,rgba(243,207,115,0.08),rgba(255,255,255,0.02))] p-3 text-center sm:p-4">
          <div className="mx-auto mb-2 grid size-10 place-items-center rounded-xl bg-amber-300/12 text-[#f3cf73] sm:size-11 sm:rounded-2xl">
            <LayoutDashboard className="size-5" aria-hidden />
          </div>
          <p className="text-xs font-black text-[#f3cf73] sm:text-sm">لوحة التحكم</p>
          <p className="mt-1 text-[0.65rem] font-bold text-white/35 sm:text-[0.7rem]">أدواتك الخاصة</p>
          <span className="io-tag mt-2 inline-block rounded-full bg-amber-300/10 px-2 py-0.5 text-[0.6rem] font-black text-amber-200/70">
            إنت هنا
          </span>
        </div>

        <div className="io-arrow flex flex-col items-center gap-1 px-1">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-white/20">
            <path d="M20 14H8M8 14L13 9M8 14L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[0.55rem] font-black text-white/25">العميل</span>
        </div>

        <div className="io-scene-right rounded-2xl border border-emerald-300/15 bg-[linear-gradient(135deg,rgba(52,211,153,0.08),rgba(255,255,255,0.02))] p-3 text-center sm:p-4">
          <div className="mx-auto mb-2 grid size-10 place-items-center rounded-xl bg-emerald-300/12 text-emerald-300 sm:size-11 sm:rounded-2xl">
            <Eye className="size-5" aria-hidden />
          </div>
          <p className="text-xs font-black text-emerald-200 sm:text-sm">الموقع public</p>
          <p className="mt-1 text-[0.65rem] font-bold text-white/35 sm:text-[0.7rem]">صور وباقات وتواصل</p>
          <span className="io-tag mt-2 inline-block rounded-full bg-emerald-300/10 px-2 py-0.5 text-[0.6rem] font-black text-emerald-200/70">
            العميل يشوف ده
          </span>
        </div>
      </div>
    </div>
  );
}

function IoCardReady() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="io-stagger relative mb-5">
        <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="relative grid size-20 place-items-center rounded-full bg-emerald-300/12 shadow-[0_0_36px_rgba(52,211,153,0.2)] sm:size-24">
          <div className="io-check-draw grid size-12 place-items-center rounded-full bg-emerald-300/20 sm:size-14">
            <Check className="size-6 text-emerald-300 sm:size-7" aria-hidden />
          </div>
        </div>
      </div>
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        موقعك شغال بالفعل
      </h2>
      <p className="io-stagger mt-3 max-w-sm text-sm leading-7 text-white/45 sm:text-base">
        إنت مش بتبني موقع من الصفر. القالب جاهز. بس خصصه.
      </p>
      <div className="io-stagger mt-5 flex items-center gap-3 text-xs font-black text-white/30">
        <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-white/40">قالب</span>
        <ArrowLeft className="size-3.5 text-emerald-300/60" aria-hidden />
        <span className="rounded-lg bg-emerald-300/10 px-3 py-1.5 text-emerald-200/70">موقعك</span>
      </div>
    </div>
  );
}

function IoCardGuided() {
  const steps = [
    { label: "ظبط باقاتك وأسعارك", color: "#f3cf73" },
    { label: "حط رقمك وروابطك", color: "#818cf8" },
    { label: "ارفع أحسن شغلك", color: "#34d399" },
  ];
  return (
    <div className="py-2 text-center">
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        مش مطلوب منك كل حاجة مرة واحدة
      </h2>
      <p className="io-stagger mt-2 text-sm leading-7 text-white/45 sm:text-base">
        النظام هيرشدك خطوة خطوة. خلي بالك من اللي قدامك بس.
      </p>
      <div className="mt-6 grid gap-2.5">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className="io-guided-step flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"
            style={{ animationDelay: `${0.5 + i * 0.2}s` }}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl text-sm font-black"
              style={{ background: `${s.color}18`, color: s.color }}
            >
              {i + 1}
            </span>
            <span className="text-sm font-black text-white/70">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IoCardStart({ onNext }: { onNext: () => void }) {
  const items = [
    { icon: Package, label: "ظبط باقاتك", color: "#f3cf73" },
    { icon: Phone, label: "حط رقمك وروابطك", color: "#818cf8" },
    { icon: Sparkles, label: "ارفع أحسن شغلك", color: "#34d399" },
  ];
  return (
    <div className="py-2 text-center">
      <div className="io-stagger mb-5">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f3cf73]/18 to-[#f3cf73]/5 shadow-[0_0_30px_rgba(243,207,115,0.2)]">
          <Zap className="size-7 text-[#f3cf73]" aria-hidden />
        </div>
      </div>
      <h2 className="io-stagger text-xl font-black text-[#fff7e8] sm:text-2xl">
        يلا نبدأ
      </h2>
      <p className="io-stagger mt-2 text-sm leading-7 text-white/40">
        أول حاجة: خلي عندك باقات واضحة. العملاء بيبدأوا من هنا.
      </p>
      <div className="mt-5 grid gap-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="io-start-item flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"
              style={{ animationDelay: `${0.5 + i * 0.18}s` }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                <Icon className="size-4.5" aria-hidden />
              </span>
              <span className="text-sm font-black text-white/70">{item.label}</span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="io-start-btn mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#e8c15e] py-3.5 text-base font-black text-[#17120a] shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-amber-500/30 sm:text-lg"
        style={{ animationDelay: "1.2s" }}
      >
        يلا نبدأ بالباقات
        <ArrowLeft className="size-5" aria-hidden />
      </button>
    </div>
  );
}

function IoAmbientBackground({ step }: { step: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px] transition-all duration-[1200ms] ease-out sm:h-[800px] sm:w-[800px]"
        style={{ background: ambientColors[step] }}
      />
      <div
        className="absolute left-[15%] top-[20%] h-48 w-48 rounded-full opacity-30 blur-[80px] transition-all duration-[1500ms] ease-out sm:h-64 sm:w-64"
        style={{ background: ambientColors[(step + 1) % TOTAL_STEPS] }}
      />
      <div
        className="absolute bottom-[15%] right-[10%] h-40 w-40 rounded-full opacity-25 blur-[70px] transition-all duration-[1800ms] ease-out sm:h-56 sm:w-56"
        style={{ background: ambientColors[(step + 2) % TOTAL_STEPS] }}
      />
    </div>
  );
}

function IoFloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="io-float-a absolute left-[8%] top-[12%] size-3 rounded-full bg-[#f3cf73]/15 sm:size-4" />
      <div className="io-float-b absolute right-[12%] top-[18%] size-2 rounded-full bg-indigo-300/12 sm:size-3" />
      <div className="io-float-c absolute bottom-[20%] left-[15%] size-2.5 rounded-full bg-emerald-300/12 sm:size-3.5" />
      <div className="io-float-d absolute bottom-[25%] right-[8%] size-2 rounded-full bg-purple-300/10 sm:size-3" />
      <div className="io-float-b absolute left-[50%] top-[8%] size-1.5 rounded-full bg-[#f3cf73]/10" />
      <div className="io-float-a absolute bottom-[10%] right-[40%] size-2 rounded-full bg-amber-300/8" />
    </div>
  );
}

function IoScanLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
      <div className="io-scan-line h-full w-32 bg-gradient-to-l from-transparent via-[#f3cf73]/50 to-transparent" />
    </div>
  );
}
