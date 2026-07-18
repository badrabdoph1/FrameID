import { CalendarDays } from "lucide-react";

import type { ResolvedSubscriptionExperience } from "@/modules/subscription/subscription-experience";

const toneClass = {
  info: "border-sky-300/20 bg-sky-300/[0.06] text-sky-100",
  success: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100",
  warning: "border-amber-300/20 bg-amber-300/[0.06] text-amber-100",
  danger: "border-red-300/20 bg-red-300/[0.06] text-red-100",
};

export function SubscriptionExperiencePreview({
  experience,
  compact = false,
}: {
  experience: ResolvedSubscriptionExperience;
  compact?: boolean;
}) {
  if (experience.visibility.effective === "hidden") {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-black/15 px-3 py-3 text-center text-xs font-bold text-white/35">
        الكارت مخفي في هذه الحالة
      </div>
    );
  }

  const timer =
    experience.timer.enabled && experience.timer.daysRemaining !== null
      ? `متبقي ${experience.timer.daysRemaining.toLocaleString("ar-EG")} يوم`
      : null;

  return (
    <div
      className={`rounded-xl border p-3 ${toneClass[experience.message.tone]} ${compact ? "text-xs" : "text-sm"}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white/8">
          <CalendarDays className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block font-black">{experience.message.title}</strong>
          <p className="mt-1 font-bold leading-5 opacity-65">
            {experience.message.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {timer ? <span className="rounded-lg bg-black/15 px-2 py-1 font-black">{timer}</span> : null}
            {experience.action.visible && experience.action.href ? (
              <span className="rounded-lg bg-white/12 px-2 py-1 font-black">
                {experience.action.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
