"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Clock, Copy, ExternalLink, Link2, Pencil, ShieldCheck, Trash2, User, X, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlugEditor } from "@/components/dashboard/slug-editor";
import { updateSiteTitleAction, requestAccountDeletionAction } from "@/app/(dashboard)/dashboard/settings/actions";
import { getPublicAccountIdentifier, isPhoneStorageEmail } from "@/modules/auth/auth-identifier";

type SettingsClientProps = {
  userName: string;
  userEmail: string;
  userPhone: string | null;
  userRole: string;
  siteTitle: string;
  siteSlug: string;
  siteStatus: string;
  siteUrl: string;
  slugChangeUsed: boolean;
  templateChangeUsed: boolean;
  deletionStatus: string | null;
  requestMessage?: string;
  errorMessage?: string;
};

const statusBadge: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: "مسودة", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)", icon: Clock },
  PUBLISHED: { label: "منشور", color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)", icon: CheckCircle2 },
  EXPIRED: { label: "منتهي", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)", icon: XCircle },
  SUSPENDED: { label: "معلق", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)", icon: XCircle },
};

const roleLabel: Record<string, string> = {
  ADMIN: "مدير",
  USER: "مستخدم",
  SUPER_ADMIN: "مدير عام",
};

export function SettingsClient({ userName, userEmail, userPhone, userRole, siteTitle: initialSiteTitle, siteSlug, siteStatus, siteUrl, slugChangeUsed, templateChangeUsed: _templateChangeUsed, deletionStatus, requestMessage, errorMessage }: SettingsClientProps) {
  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [siteTitle, setSiteTitle] = useState(initialSiteTitle);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const badge = statusBadge[siteStatus] ?? { label: siteStatus, color: "rgba(245, 234, 214, 0.5)", bg: "rgba(245, 234, 214, 0.05)", icon: ShieldCheck };
  const StatusIcon = badge.icon;
  const loginIdentifier = getPublicAccountIdentifier({ email: userEmail, phone: userPhone });
  const showRealEmail = !isPhoneStorageEmail(userEmail);

  void _templateChangeUsed;

  async function copyUrl() {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function startEditingTitle() {
    setEditingTitle(true);
    window.setTimeout(() => titleInputRef.current?.focus(), 50);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4" data-smart-tip="settings-main">
      {requestMessage === "deletion-submitted" ? (
        <NoticeCard tone="success" title="تم إرسال طلب حذف الحساب" description="سيتم مراجعته من فريق الدعم والتواصل معك قريبًا." />
      ) : null}
      {requestMessage === "pending" ? (
        <NoticeCard tone="warning" title="لديك طلب حذف قيد المراجعة" description="لا يمكن إرسال طلب جديد حتى يتم الرد على الطلب السابق." />
      ) : null}
      {deletionStatus === "APPROVED" ? (
        <NoticeCard tone="error" title="تم حذف الحساب" description="تم حذف حسابك وموقعك بناءً على طلبك. سيتم إيقاف الموقع نهائيًا. للاستفسار، تواصل مع الدعم." />
      ) : null}
      {deletionStatus === "REJECTED" ? (
        <NoticeCard tone="warning" title="تم رفض طلب حذف الحساب" description="لم يتم الموافقة على طلب حذف الحساب. للاستفسار، تواصل مع الدعم." />
      ) : null}
      {errorMessage ? (
        <NoticeCard tone="error" title="حدث خطأ" description={errorMessage} />
      ) : null}
      {requestMessage === "title-updated" ? (
        <NoticeCard tone="success" title="تم تحديث اسم الموقع" description="سيظهر الاسم الجديد للزوار." />
      ) : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
        <header className="flex items-start gap-3 border-b border-white/8 p-4 sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><User className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-[#fff7e8]">حسابك والموقع</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">معلوماتك الشخصية وبيانات الموقع في مكان واحد.</p>
          </div>
        </header>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-black text-white/40">اسم الموقع</p>
              {editingTitle ? (
                <form
                  action={updateSiteTitleAction}
                  onSubmit={(event) => {
                    const input = (event.target as HTMLFormElement).querySelector("input");
                    if (!input || input.value.trim().length < 2) {
                      event.preventDefault();
                      return;
                    }
                    setEditingTitle(false);
                  }}
                  className="mt-1.5 flex items-center gap-2"
                >
                  <input
                    ref={titleInputRef}
                    name="title"
                    defaultValue={siteTitle}
                    className="min-w-0 flex-1 rounded-xl border border-amber-300/25 bg-black/20 px-3 py-2 text-sm font-black text-[#fff7e8] outline-none transition focus:border-[#f3cf73]"
                    maxLength={60}
                  />
                  <button type="submit" className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f3cf73] text-[#17120a] transition hover:bg-[#ffe08a]">
                    <Check className="size-4" />
                  </button>
                  <button type="button" onClick={() => setEditingTitle(false)} className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08]">
                    <X className="size-4" />
                  </button>
                </form>
              ) : (
                <>
                  <div className="mt-1.5 flex items-center gap-2">
                    <h3 className="truncate text-xl font-black text-[#fff7e8] sm:text-2xl">{siteTitle}</h3>
                    <button type="button" onClick={startEditingTitle} className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-amber-300/10 hover:text-[#f3cf73]" title="تعديل اسم الموقع">
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2" dir="ltr">
                    <span className="truncate text-xs font-bold text-amber-300/70">{siteUrl}</span>
                    <button
                      type="button"
                      onClick={copyUrl}
                      className="grid size-6 shrink-0 place-items-center rounded-lg border border-amber-300/20 bg-amber-400/10 text-amber-200/80 transition hover:bg-amber-400/20"
                      title="نسخ الرابط"
                    >
                      {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="grid gap-2">
              <InfoRow label="الاسم" value={userName} />
              <InfoRow label="بيانات الدخول" value={loginIdentifier} dir="ltr" />
              {showRealEmail && userPhone ? <InfoRow label="رقم الهاتف" value={userPhone} dir="ltr" /> : null}
              {showRealEmail ? <InfoRow label="البريد" value={userEmail} dir="ltr" /> : null}
              <InfoRow label="الدور" value={roleLabel[userRole] ?? userRole} />
            </div>

            <div className="grid gap-2">
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
                <p className="text-xs font-black leading-6 text-amber-200">
                  دا الرابط بتاع موقعك — انسخه وابعته لعميلك
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
                <span className="shrink-0 text-xs font-black text-white/40">الحالة</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black" style={{ color: badge.color, background: badge.bg }}>
                  <StatusIcon className="size-3.5" />
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="luxury" className="min-h-10 flex-1 rounded-2xl font-black" onClick={copyUrl}>
                  {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "اتنسخ" : "نسخ الرابط"}
                </Button>
                <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.08] hover:text-white">
                  <ExternalLink className="size-4" />
                  فتح الموقع
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Panel icon={Link2} title="رابط الموقع" description="الرابط المختصر مهم جدًا. اختاره واضح وسهل في النطق والكتابة.">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
            <p className="text-[0.68rem] font-black text-white/40">الرابط الحالي</p>
            <p dir="ltr" className="mt-1 break-all text-sm font-black leading-6 text-[#f3cf73]">{siteUrl}</p>
          </div>
          <SlugEditor currentSlug={siteSlug} disabled={slugChangeUsed} />
        </div>
      </Panel>

      <section className="overflow-hidden rounded-[1.35rem] border border-red-300/15 bg-red-500/[0.035]">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-300"><Trash2 className="size-4" /></span>
            <div>
              <h2 className="text-sm font-black text-red-100">حذف الحساب</h2>
              <p className="mt-0.5 text-xs font-bold leading-6 text-white/45">
                {deletionStatus === "PENDING" || deletionStatus === "IN_REVIEW"
                  ? "لديك طلب حذف قيد المراجعة حاليًا."
                  : deletionStatus === "APPROVED"
                    ? "تمت الموافقة على حذف الحساب."
                    : deletionStatus === "REJECTED"
                      ? "تم رفض طلب حذف الحساب."
                      : "سيتم إرسال طلب للفريق لمراجعة الحذف والتواصل معك."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeletionModal(true)}
            disabled={deletionStatus !== null && deletionStatus !== "REJECTED"}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-3 text-xs font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 className="size-3.5" />
            {deletionStatus === "PENDING" || deletionStatus === "IN_REVIEW" ? "طلب مُرسل" : "طلب الحذف"}
          </button>
        </div>
      </section>

      {showDeletionModal ? (
        <DeletionModal
          onClose={() => setShowDeletionModal(false)}
        />
      ) : null}
    </main>
  );
}

function NoticeCard({ tone, title, description }: { tone: "success" | "warning" | "error"; title: string; description: string }) {
  const classes = tone === "success"
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
    : tone === "warning"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
      : "border-red-300/20 bg-red-500/10 text-red-200";

  return (
    <section className={`rounded-2xl border px-4 py-3 ${classes}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-0.5 text-xs font-bold leading-6 opacity-75">{description}</p>
    </section>
  );
}

function Panel({ icon: Icon, title, description, children }: { icon: typeof User; title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
      <header className="flex items-start gap-3 border-b border-white/8 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-5" /></span>
        <div><h2 className="text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p></div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, dir, highlight }: { label: string; value: string; dir?: "ltr" | "rtl"; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
      <span className="shrink-0 text-xs font-black text-white/40">{label}</span>
      <span dir={dir} className={`min-w-0 truncate text-sm font-black ${highlight ? "text-[#f3cf73]" : "text-[#fff7e8]"}`}>{value}</span>
    </div>
  );
}

const DELETION_REASONS = [
  { value: "لم أعد بحاجة للموقع", label: "لم أعد بحاجة للموقع", desc: "ما عادش عندي استخدام للموقع أو الخدمة" },
  { value: "السعر مرتفع جداً", label: "السعر مرتفع جداً", desc: "التكلفة مش مناسبة للميزانية دلوقتي" },
  { value: "أستخدم منصة منافسة", label: "أستخدم منصة منافسة", desc: "لقيت منصة تانية بتناسب احتياجاتي أكثر" },
  { value: "سبب آخر", label: "سبب آخر", desc: "عندي سبب مختلف وحابب أكتبه" },
];

function DeletionModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState("");
  const [otherText, setOtherText] = useState("");

  const canSubmit = selected && (selected !== "سبب آخر" || otherText.trim().length >= 3);

  function handleBackdrop(event: React.MouseEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg animate-[fadeIn_150ms_ease] overflow-hidden rounded-[1.5rem] border border-red-300/20 bg-[#120c0c] shadow-2xl shadow-red-500/10">
        <div className="border-b border-white/8 px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-red-500/12 text-red-300">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#fff7e8]">طلب حذف الحساب</h2>
              <p className="mt-0.5 text-xs font-bold leading-6 text-white/45">
                اختار سبب الحذف عشان نساعدك نحل المشكلة أو نحسن الخدمة.
              </p>
            </div>
          </div>
        </div>

        <form action={requestAccountDeletionAction} className="grid gap-1 px-5 py-4">
          <div className="grid gap-1.5">
            {DELETION_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  selected === reason.value
                    ? "border-red-300/35 bg-red-500/8"
                    : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="radio"
                  name="deletionReason"
                  value={reason.value}
                  checked={selected === reason.value}
                  onChange={(e) => setSelected(e.target.value)}
                  className="mt-0.5 size-4 shrink-0 accent-red-400"
                />
                <div className="min-w-0">
                  <p className={`text-sm font-black ${selected === reason.value ? "text-red-200" : "text-[#fff7e8]"}`}>
                    {reason.label}
                  </p>
                  <p className="mt-0.5 text-xs font-bold leading-5 text-white/40">{reason.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {selected === "سبب آخر" ? (
            <div className="mt-1 animate-[fadeIn_150ms_ease]">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/50">اكتب سبب الحذف</span>
                <textarea
                  name="otherReason"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  rows={3}
                  className="min-h-[5rem] w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm font-bold text-[#fff7e8] outline-none transition placeholder:text-white/25 focus:border-red-300/30"
                  placeholder="شاركنا السبب عشان نقدر نتحسن..."
                />
              </label>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/65 transition hover:bg-white/[0.08]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/25 bg-red-500/12 px-4 text-sm font-black text-red-200 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Trash2 className="size-4" />
              تأكيد الحذف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
