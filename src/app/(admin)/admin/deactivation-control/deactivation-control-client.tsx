"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Eye, RefreshCw, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { toggleDeactivationPauseAction } from "@/app/(admin)/admin/deactivation-control/actions";
import { Metric } from "@/components/layout/admin-metric";
import { AccountsModal } from "@/app/(admin)/admin/deactivation-control/accounts-modal";

type Stats = {
  paused: boolean;
  total: number;
  active: number;
  expiredButActive: number;
  wouldDeactivate: number;
};

type DeactivationControlClientProps = {
  trialStats: Stats;
  paidStats: Stats;
};

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "warning",
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="admin-scale-in relative z-10 w-full max-w-md rounded-2xl border border-white/8 bg-[#0a0a0a] p-6 shadow-2xl">
        <button type="button" aria-label="إغلاق" onClick={onClose} disabled={loading} className="absolute left-3 top-3 grid size-10 place-items-center rounded-xl text-white/40 transition hover:bg-white/6 hover:text-white disabled:opacity-40">
          <X className="size-4" />
        </button>
        <h2 className="text-lg font-black text-white">{title}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/55">{description}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-11 flex-1 rounded-xl border border-white/8 px-4 text-sm font-extrabold text-white/60 transition hover:bg-white/6 hover:text-white disabled:opacity-40">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={cn(
            "min-h-11 flex-1 rounded-xl px-4 text-sm font-extrabold transition disabled:opacity-40",
            variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
            variant === "warning" && "bg-amber-500 text-[#17120a] hover:bg-amber-600",
            variant === "default" && "bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-[#17120a] hover:opacity-90",
          )}>{loading ? "جارٍ التنفيذ..." : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/18 bg-amber-500/6 p-4 text-[0.82rem] font-extrabold text-amber-200/90 leading-relaxed">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <div>{children}</div>
    </div>
  );
}

function DeactivationCard({
  title,
  description,
  stats: initialStats,
  type,
  onShowAccounts,
}: {
  title: string;
  description: string;
  stats: Stats;
  type: "trial" | "paid";
  onShowAccounts: (filter: "all" | "expired-active", title: string) => void;
}) {
  const [paused, setPaused] = useState(initialStats.paused);
  const [toggling, setToggling] = useState(false);
  const [showPauseWarning, setShowPauseWarning] = useState(false);
  const [showUnpauseConfirm, setShowUnpauseConfirm] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const executeToggle = useCallback(async (checked: boolean) => {
    setToggling(true);
    setShowPauseWarning(false);
    setShowUnpauseConfirm(false);
    setResultMessage(null);

    try {
      const result = await toggleDeactivationPauseAction(type, checked);
      if (result.success) {
        setPaused(result.paused ?? false);
        const deactivated = result.deactivatedCount ?? 0;
        if (!result.paused && deactivated > 0) {
          setResultMessage(`تم تعطيل ${deactivated} ${type === "trial" ? "حسابًا تجريبيًا" : "حسابًا مدفوعًا"} انتهت مدتها.`);
        } else if (result.paused) {
          setResultMessage(`تم تفعيل تعليق التعطيل. ${type === "trial" ? "الحسابات التجريبية" : "الحسابات المدفوعة"} لن يتم تعطيلها تلقائيًا.`);
        } else {
          setResultMessage("تم إلغاء تعليق التعطيل بنجاح.");
        }
      } else {
        setResultMessage(result.error ?? "حدث خطأ. يرجى المحاولة مرة أخرى.");
      }
    } catch {
      setResultMessage("حدث خطأ. يرجى المحاولة مرة أخرى.");
    } finally {
      setToggling(false);
    }
  }, [type]);

  const handleToggle = useCallback((checked: boolean) => {
    if (toggling) return;

    if (checked) {
      setShowPauseWarning(true);
    } else if (initialStats.wouldDeactivate > 0) {
      setShowUnpauseConfirm(true);
    } else {
      executeToggle(checked);
    }
  }, [toggling, initialStats.wouldDeactivate, executeToggle]);

  return (
    <section className="rounded-2xl border border-white/8 bg-[#0c0e13] p-5 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-[#fff7e8]">{title}</h3>
          <p className="mt-1 text-[0.78rem] font-extrabold text-white/48">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {toggling && (
            <RefreshCw className="size-4 animate-spin text-amber-400" />
          )}
          <Switch
            checked={paused}
            onCheckedChange={handleToggle}
            disabled={toggling}
            label={paused ? "قيد التعليق" : "متوقف"}
          />
        </div>
      </div>

      {paused && (
        <InfoBanner>
          {type === "trial"
            ? "تم تعليق التعطيل التلقائي للحسابات التجريبية. الحسابات تستمر في العمل حتى لو انتهت مدتها، والأيام تستمر في العد بشكل طبيعي، ولن يتم تمديد أي مدة."
            : "تم تعليق التعطيل التلقائي للحسابات المدفوعة. الحسابات تستمر في العمل حتى لو انتهت مدتها، والأيام تستمر في العد بشكل طبيعي، ولن يتم تمديد أي اشتراك."}
        </InfoBanner>
      )}

      {resultMessage && (
        <div className="mt-4 rounded-xl border border-emerald-500/18 bg-emerald-500/6 px-4 py-3 text-[0.82rem] font-extrabold text-emerald-200/90">
          {resultMessage}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="إجمالي الحسابات" value={initialStats.total} />
        <Metric label="الحسابات النشطة" value={initialStats.active} tone="success" />
        {paused && (
          <>
            <Metric label="منتهية وتعمل بسبب التعليق" value={initialStats.expiredButActive} tone="warning" />
            <Metric label="ستتوقف عند إلغاء التعليق" value={initialStats.wouldDeactivate} tone="danger" />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onShowAccounts("all", type === "trial" ? "جميع الحسابات التجريبية" : "جميع الحسابات المدفوعة")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[0.78rem] font-extrabold text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Eye size={15} />
          عرض جميع الحسابات
        </button>
        {paused && initialStats.expiredButActive > 0 && (
          <button
            type="button"
            onClick={() => onShowAccounts("expired-active", type === "trial" ? "الحسابات التجريبية المنتهية والتي ما زالت تعمل" : "الحسابات المدفوعة المنتهية والتي ما زالت تعمل")}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-[0.78rem] font-extrabold text-amber-300/90 transition hover:border-amber-500/30 hover:bg-amber-500/12"
          >
            <AlertTriangle size={15} />
            عرض الحسابات المعلقة ({initialStats.expiredButActive})
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showPauseWarning}
        title="تأكيد تعليق التعطيل"
        description="عند تشغيل تعليق التعطيل:\n\n• العداد الزمني سيستمر ولن يتوقف.\n• لن يتم تمديد أي اشتراك أو فترة تجربة.\n• سيتم فقط منع التعطيل التلقائي مؤقتًا.\n• جميع الحسابات ستستمر في العمل بشكل طبيعي."
        confirmLabel="نعم، علّق التعطيل"
        cancelLabel="إلغاء"
        variant="warning"
        loading={toggling}
        onClose={() => setShowPauseWarning(false)}
        onConfirm={() => executeToggle(true)}
      />

      <ConfirmDialog
        open={showUnpauseConfirm}
        title="تأكيد إلغاء التعليق"
        description={`سيتم تعطيل ${initialStats.wouldDeactivate} ${type === "trial" ? "حسابًا تجريبيًا" : "حسابًا مدفوعًا"} انتهت مدتها. هل تريد المتابعة؟`}
        confirmLabel="نعم، ألغِ التعليق وعطّل الحسابات"
        cancelLabel="إلغاء"
        variant="danger"
        loading={toggling}
        onClose={() => setShowUnpauseConfirm(false)}
        onConfirm={() => executeToggle(false)}
      />
    </section>
  );
}

export function DeactivationControlClient({ trialStats, paidStats }: DeactivationControlClientProps) {
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [accountsModalTitle, setAccountsModalTitle] = useState("");
  const [accountsModalType, setAccountsModalType] = useState<"trial" | "paid">("trial");
  const [accountsModalFilter, setAccountsModalFilter] = useState<"all" | "expired-active">("all");

  const handleShowAccounts = useCallback((type: "trial" | "paid") => (filter: "all" | "expired-active", title: string) => {
    setAccountsModalType(type);
    setAccountsModalFilter(filter);
    setAccountsModalTitle(title);
    setShowAccountsModal(true);
  }, []);

  return (
    <div className="grid gap-5">
      <DeactivationCard
        title="تعليق تعطيل الحسابات التجريبية"
        description="أوقف التعطيل التلقائي للحسابات التجريبية مؤقتًا مع استمرار العد التنازلي"
        stats={trialStats}
        type="trial"
        onShowAccounts={handleShowAccounts("trial")}
      />

      <DeactivationCard
        title="تعليق تعطيل الحسابات المدفوعة"
        description="أوقف التعطيل التلقائي للحسابات المدفوعة مؤقتًا مع استمرار العد التنازلي"
        stats={paidStats}
        type="paid"
        onShowAccounts={handleShowAccounts("paid")}
      />

      <AccountsModal
        open={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        title={accountsModalTitle}
        type={accountsModalType}
        filter={accountsModalFilter}
      />
    </div>
  );
}
