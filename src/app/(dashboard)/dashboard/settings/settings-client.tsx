"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Clock, Copy, ExternalLink, Globe2, Link2, ShieldCheck, Trash2, User, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlugEditor } from "@/components/dashboard/slug-editor";
import { requestAccountDeletionAction } from "@/app/(dashboard)/dashboard/settings/actions";
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
  hasDeletionRequest: boolean;
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

export function SettingsClient({ userName, userEmail, userPhone, userRole, siteTitle, siteSlug, siteStatus, siteUrl, slugChangeUsed, templateChangeUsed: _templateChangeUsed, hasDeletionRequest, requestMessage, errorMessage }: SettingsClientProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const badge = statusBadge[siteStatus] ?? { label: siteStatus, color: "rgba(245, 234, 214, 0.5)", bg: "rgba(245, 234, 214, 0.05)", icon: ShieldCheck };
  const StatusIcon = badge.icon;
  const loginIdentifier = getPublicAccountIdentifier({ email: userEmail, phone: userPhone });
  const showRealEmail = !isPhoneStorageEmail(userEmail);

  async function copyUrl() {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  void _templateChangeUsed;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4" data-smart-tip="settings-main">
      {requestMessage === "deletion-submitted" ? (
        <NoticeCard tone="success" title="تم إرسال طلب حذف الحساب" description="سيتم مراجعته من فريق الدعم والتواصل معك قريبًا." />
      ) : null}
      {requestMessage === "pending" ? (
        <NoticeCard tone="warning" title="لديك طلب حذف قيد المراجعة" description="لا يمكن إرسال طلب جديد حتى يتم الرد على الطلب السابق." />
      ) : null}
      {errorMessage ? (
        <NoticeCard tone="error" title="حدث خطأ" description={errorMessage} />
      ) : null}

      <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_36%),rgba(255,255,255,0.035)]">
        <header className="flex items-start gap-3 border-b border-white/8 p-4 sm:p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><User className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.72rem] font-black text-[#f3cf73]">حسابك والموقع</p>
            <h1 className="mt-1 text-xl font-black text-[#fff7e8] sm:text-2xl">{siteTitle}</h1>
          </div>
          <div className="grid shrink-0 gap-2 sm:flex">
            <Button type="button" variant="luxury" className="min-h-10 rounded-2xl font-black" onClick={copyUrl}>
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? "اتنسخ" : "نسخ الرابط"}
            </Button>
            <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.08] hover:text-white">
              <ExternalLink className="size-4" />
              فتح الموقع
            </Link>
          </div>
        </header>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
          <div className="grid gap-2">
            <InfoRow label="الاسم" value={userName} />
            <InfoRow label="بيانات الدخول" value={loginIdentifier} dir="ltr" />
            {showRealEmail && userPhone ? <InfoRow label="رقم الهاتف" value={userPhone} dir="ltr" /> : null}
            {showRealEmail ? <InfoRow label="البريد" value={userEmail} dir="ltr" /> : null}
            <InfoRow label="الدور" value={roleLabel[userRole] ?? userRole} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
              <span className="shrink-0 text-xs font-black text-white/40">الرابط</span>
              <p dir="ltr" className="min-w-0 truncate text-sm font-black leading-6 text-[#f3cf73]">{siteUrl}</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
              <span className="shrink-0 text-xs font-black text-white/40">الحالة</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black" style={{ color: badge.color, background: badge.bg }}>
                <StatusIcon className="size-3.5" />
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      <Panel icon={Link2} title="رابط الموقع" description="الرابط المختصر مهم جدًا. اختاره واضح وسهل في النطق والكتابة.">
        <div className="grid gap-3">
          <div className={slugChangeUsed ? "rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3" : "rounded-2xl border border-white/8 bg-black/15 p-3"}>
            <p className="text-sm font-black text-[#fff7e8]">{slugChangeUsed ? "تم استخدام فرصة تغيير الرابط" : "مسموح بتغيير الرابط مرة واحدة"}</p>
            <p className="mt-1 text-xs font-bold leading-6 text-white/48">
              {slugChangeUsed ? "لو محتاج تغييره مرة أخرى تواصل مع الدعم حتى لا تتأثر روابطك القديمة." : "اختار اسم قصير يعبر عنك، مثل اسم البراند أو الاستوديو."}
            </p>
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
                {hasDeletionRequest ? "لديك طلب حذف قيد المراجعة حاليًا." : "سيتم إرسال طلب للفريق لمراجعة الحذف والتواصل معك."}
              </p>
            </div>
          </div>
          <form action={requestAccountDeletionAction} onSubmit={() => { if (!window.confirm("هل أنت متأكد من طلب حذف الحساب؟ سيتم مراجعة الطلب من فريق الدعم.")) { return; } }}>
            <button
              type="submit"
              disabled={hasDeletionRequest || isPending}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-3 text-xs font-black text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="size-3.5" />
              {hasDeletionRequest ? "طلب مُرسل" : "طلب الحذف"}
            </button>
          </form>
        </div>
      </section>
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

function InfoRow({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
      <span className="shrink-0 text-xs font-black text-white/40">{label}</span>
      <span dir={dir} className="min-w-0 truncate text-sm font-black text-[#fff7e8]">{value}</span>
    </div>
  );
}
