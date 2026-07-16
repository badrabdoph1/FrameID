"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";

interface VerificationSectionProps {
  onVerify: () => Promise<void>;
  result: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
  } | null;
}

export function VerificationSection({ onVerify, result }: VerificationSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">التحقق من المنصة</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          فحص سلامة المنصة والتأكد من حالة الوحدات والخدمات
        </p>
      </div>

      <PendingForm action={onVerify}>
        <PendingButton
          pendingText="جاري التحقق..."
          className="rounded-xl bg-[#f3cf73] px-8 py-3 text-sm font-black text-[#17120a]"
        >
          Verify Platform
        </PendingButton>
      </PendingForm>

      {result ? (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <p className="mb-3 text-xs font-black text-white/50">نتيجة التحقق</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
              <p className="text-lg font-black text-white/80">{result.total}</p>
              <p className="mt-0.5 text-[11px] font-bold text-white/40">إجمالي الفحوصات</p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-center">
              <p className="text-lg font-black text-emerald-400">{result.passed}</p>
              <p className="mt-0.5 text-[11px] font-bold text-emerald-400/60">نجح</p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3 text-center">
              <p className="text-lg font-black text-amber-400">{result.warnings}</p>
              <p className="mt-0.5 text-[11px] font-bold text-amber-400/60">تحذير</p>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3 text-center">
              <p className="text-lg font-black text-red-400">{result.errors}</p>
              <p className="mt-0.5 text-[11px] font-bold text-red-400/60">خطأ</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
