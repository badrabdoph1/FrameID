"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { saveTrialPolicyAction } from "@/app/(admin)/admin/messages/actions";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-[#0b0d12]/80 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8";

const checkboxLabelClass =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 text-xs font-black text-white/60 transition hover:border-amber-300/20 hover:text-[#f3cf73]";

type Props = {
  defaultDays: number;
};

export function TrialPolicyCard({ defaultDays }: Props) {
  const [days, setDays] = useState(defaultDays);

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-amber-300/16 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <form action={saveTrialPolicyAction}>
        <div className="grid gap-5 p-4 xl:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/12 text-[#f3cf73]">
              <CalendarDays className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#f3cf73]">
                Trial Policy
              </p>
              <h2 className="mt-1 text-lg font-black text-[#fff7e8] lg:text-xl">
                سياسة الفترة التجريبية
              </h2>
              <p className="mt-1 text-xs font-bold leading-6 text-white/45">
                تُحسب المدة من تاريخ إنشاء الحساب. عند التطبيق على العملاء الحاليين تُحتسب المدة كاملة من وقت إنشاء حسابهم.
              </p>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.2rem] border border-white/10 bg-black/16 p-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-white/42">
                عدد أيام الفترة التجريبية للحسابات الجديدة
              </span>
              <input
                name="trialPolicyDefaultDays"
                type="number"
                min={1}
                max={3650}
                value={days}
                onChange={(event) => setDays(Number(event.target.value || defaultDays))}
                className={inputClass}
              />
            </label>

            <div className="grid gap-2">
              <p className="text-xs font-black text-white/42">تطبيق المدة الجديدة على:</p>
              <label className={checkboxLabelClass}>
                <input
                  name="applyTrialToTrial"
                  type="checkbox"
                  className="accent-amber-400"
                />
                <span>العملاء في حالة تجربة حالية (TRIAL)</span>
              </label>
              <label className={checkboxLabelClass}>
                <input
                  name="applyTrialToExpired"
                  type="checkbox"
                  className="accent-amber-400"
                />
                <span>العملاء الذين انتهت تجربتهم (TRIAL_EXPIRED)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="min-h-12 rounded-2xl border border-amber-300/36 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5"
          >
            حفظ سياسة الفترة التجريبية
          </button>
        </div>
      </form>
    </section>
  );
}
