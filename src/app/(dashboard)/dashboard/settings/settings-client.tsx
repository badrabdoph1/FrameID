"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Copy, ExternalLink, Globe2, Link2, ShieldCheck, Trash2, User, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SlugEditor } from "@/components/dashboard/slug-editor";
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

export function SettingsClient({ userName, userEmail, userPhone, userRole, siteTitle, siteSlug, siteStatus, siteUrl, slugChangeUsed }: SettingsClientProps) {
  const [copied, setCopied] = useState(false);
  const badge = statusBadge[siteStatus] ?? { label: siteStatus, color: "rgba(245, 234, 214, 0.5)", bg: "rgba(245, 234, 214, 0.05)", icon: ShieldCheck };
  const StatusIcon = badge.icon;
  const loginIdentifier = getPublicAccountIdentifier({ email: userEmail, phone: userPhone });
  const showRealEmail = !isPhoneStorageEmail(userEmail);

  async function copyUrl() {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">الإعدادات</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">إعدادات الحساب والموقع</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              معلومات الحساب الأساسية، حالة الموقع، والرابط العام. خلي بالك: تغيير الرابط متاح مرة واحدة فقط.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Button type="button" variant="luxury" className="min-h-11 rounded-2xl font-black" onClick={copyUrl}>
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? "اتنسخ" : "نسخ الرابط"}
            </Button>
            <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.08] hover:text-white">
              <ExternalLink className="size-4" />
              فتح الموقع
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.8fr_1fr]">
        <Panel icon={User} title="حسابك" description="البيانات الأساسية للدخول وإدارة الموقع.">
          <div className="grid gap-2">
            <InfoRow label="الاسم" value={userName} />
            <InfoRow label="بيانات الدخول" value={loginIdentifier} dir="ltr" />
            {showRealEmail && userPhone ? <InfoRow label="رقم الهاتف" value={userPhone} dir="ltr" /> : null}
            {showRealEmail ? <InfoRow label="البريد" value={userEmail} dir="ltr" /> : null}
            <InfoRow label="الدور" value={roleLabel[userRole] ?? userRole} />
          </div>
        </Panel>

        <Panel icon={Globe2} title="معلومات الموقع" description="حالة الموقع والرابط اللي بيظهر للزوار.">
          <div className="grid gap-2">
            <InfoRow label="العنوان" value={siteTitle} />
            <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
              <p className="text-xs font-black text-white/40">الرابط</p>
              <p dir="ltr" className="mt-1 break-all text-sm font-black leading-6 text-[#f3cf73]">{siteUrl}</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
              <span className="text-xs font-black text-white/40">الحالة</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black" style={{ color: badge.color, background: badge.bg }}>
                <StatusIcon className="size-3.5" />
                {badge.label}
              </span>
            </div>
          </div>
        </Panel>
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

      <Panel icon={Trash2} title="منطقة خطرة" description="أي حذف دائم لازم يكون واضح ومقصود.">
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
          <p className="text-sm font-black text-red-100">حذف الحساب غير متاح من هنا حاليًا</p>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">الحذف النهائي يحتاج مراجعة دعم حتى لا تفقد الصور والموقع بالغلط.</p>
          <button disabled className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 text-sm font-black text-red-200/50">
            <Trash2 className="size-4" />
            قريبًا
          </button>
        </div>
      </Panel>
    </main>
  );
}

function Panel({ icon: Icon, title, description, children }: { icon: typeof User; title: string; description: string; children: React.ReactNode }) {
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
