"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";

interface RecoverySimulationProps {
  onSimulate: () => Promise<void>;
}

export function RecoverySimulation({ onSimulate }: RecoverySimulationProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">محاكاة الاستعادة</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          اختبار عملية نقل المشروع دون تنفيذ فعلي
        </p>
      </div>
      <PendingForm action={onSimulate}>
        <PendingButton
          pendingText="جاري المحاكاة..."
          className="rounded-xl bg-[#f3cf73] px-8 py-3 text-sm font-black text-[#17120a]"
        >
          اختبار الاستعادة
        </PendingButton>
      </PendingForm>
    </section>
  );
}
