"use client";

import { Sparkles, LayoutDashboard, CheckCircle2, ArrowLeft, X, ChevronLeft } from "lucide-react";
import { useGuidance } from "@/modules/guidance";
import Link from "next/link";

const tourSteps = [
  {
    icon: Sparkles,
    title: "أهلاً بيك في FrameID",
    body: "FrameID هو موقعك الشخصي كـمصور. صفحة واحدة فيها شغلك، باقاتك، وطرق التواصل معاك. جاهزة ومبنية — إنت بس بتخصصها.",
  },
  {
    icon: LayoutDashboard,
    title: "فين إنت دلوقتي؟",
    body: "دي لوحة التحكم — مكانك إنت بس. بتغير منها الباقات والصور وبياناتك. عملاؤك مش هيشوفوها أبداً.",
    showPreviewLink: true,
  },
  {
    icon: CheckCircle2,
    title: "موقعك جاهز!",
    body: "موقعك اتبنى تلقائياً بالقالب اللي اخترته. كل اللي عليك تغيّر المحتوى لمحتواك الحقيقي: باقاتك، صورك، بياناتك.",
  },
  {
    icon: ArrowLeft,
    title: "ابدأ من هنا",
    body: "أول خطوة: اكتب باقاتك وأسعارك. بعدها كمّل باقي الخطوات بالترتيب. كل خطوة بتاخد دقايق.",
    showStartButton: true,
  },
];

export function WelcomeTour({ siteUrl }: { siteUrl?: string }) {
  const { tour, analytics } = useGuidance();

  if (!tour.isActive) return null;

  const currentStep = tourSteps[tour.currentStep];
  if (!currentStep) return null;

  const Icon = currentStep.icon;
  const isFirst = tour.currentStep === 0;
  const isLast = tour.currentStep === tour.totalSteps - 1;

  const handleNext = () => {
    analytics.track({ type: "tour_start", metadata: { step: tour.currentStep, action: "next" } });
    if (isLast) {
      tour.complete();
    } else {
      tour.next();
    }
  };

  const handlePrev = () => {
    tour.prev();
  };

  const handleSkip = () => {
    tour.skip();
  };

  return (
    <div className="welcome-tour-container mx-auto w-full max-w-5xl px-4 sm:px-6 lg:max-w-[1180px]">
      <div className="welcome-tour-card overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#131820] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(243,207,115,0.04))] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#f3cf73] sm:text-sm">
              خطوة {tour.currentStep + 1} من {tour.totalSteps}
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="grid size-8 place-items-center rounded-xl text-white/45 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="تخطي الجولة"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-2 flex gap-1">
            {tourSteps.map((_, i) => (
              <span
                key={i}
                className={
                  i <= tour.currentStep
                    ? "h-1 flex-1 rounded-full bg-[#f3cf73] transition-all"
                    : "h-1 flex-1 rounded-full bg-white/10 transition-all"
                }
              />
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-amber-300/8 text-[#f3cf73] shadow-[0_0_16px_rgba(243,207,115,0.25)] sm:size-14 sm:rounded-3xl">
              <Icon className="size-5 sm:size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-[#fff7e8] sm:text-xl lg:text-2xl">
                {currentStep.title}
              </h2>
              <p className="mt-2 text-sm font-bold leading-7 text-white/60 sm:text-base sm:leading-8">
                {currentStep.body}
              </p>

              {currentStep.showPreviewLink && siteUrl ? (
                <Link
                  href={siteUrl}
                  target="_blank"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#f3cf73] no-underline transition hover:text-[#ffe08a]"
                >
                  <LayoutDashboard className="size-4" aria-hidden />
                  شوف موقعك كما يراه العميل
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/8 p-3 sm:gap-3 sm:p-4">
          {!isFirst ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/70 transition hover:bg-white/[0.08] sm:min-h-12"
            >
              السابق
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a] sm:min-h-12"
          >
            {isLast ? "يلا نبدأ" : "التالي"}
            {isLast ? null : <ChevronLeft className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  );
}
