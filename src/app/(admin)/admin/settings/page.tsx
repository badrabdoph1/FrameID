import { Headphones, MessageCircle, Save } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { getSupportSettings, toWhatsappHref } from "@/modules/support/support-settings";
import { updateSupportWhatsappAction } from "@/app/(admin)/admin/settings/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ supportSaved?: string; supportError?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;
  const supportSettings = await getSupportSettings();

  return (
    <AdminPageShell
      badge="الإعدادات"
      title="إعدادات المنصة"
      description="تكوين وإعدادات المنصة العامة"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">عام</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/35">اسم المنصة</label>
              <p className="text-sm text-white/80">FrameID</p>
            </div>
            <div>
              <label className="text-xs text-white/35">البريد الرسمي</label>
              <p className="text-sm text-white/80">admin@frameid.app</p>
            </div>
            <div>
              <label className="text-xs text-white/35">العملة الافتراضية</label>
              <p className="text-sm text-white/80">جنيه مصري (EGP)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">العلامة التجارية</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/35">الشعار</label>
              <p className="text-sm text-white/50">—</p>
            </div>
            <div>
              <label className="text-xs text-white/35">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-full bg-champagne" />
                <span className="text-sm text-white/80">Champagne #d8b46a</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">الفريق</h3>
          <p className="text-sm text-white/50">
            إدارة فريق الإدارة العليا والصلاحيات
          </p>
          <a
            href="/admin/settings/team"
            className="mt-3 inline-flex text-sm text-champagne underline-offset-4 hover:underline"
          >
            إدارة الفريق
          </a>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-400/16 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.035))]">
        <header className="flex items-start gap-3 border-b border-white/10 p-5">
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-400/12 text-emerald-300">
            <Headphones className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#fff7e8]">الدعم الفني</h2>
            <p className="mt-1 text-sm font-bold leading-7 text-white/48">
              الرقم المستخدم في زر الدعم الفني العائم داخل صفحات المنصة. لا يظهر الزر داخل مواقع العملاء المنشورة.
            </p>
          </div>
        </header>

        <form action={updateSupportWhatsappAction} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <label htmlFor="supportWhatsapp" className="text-xs font-black text-white/42">رقم واتساب الدعم الفني</label>
            <input
              id="supportWhatsapp"
              name="supportWhatsapp"
              type="tel"
              dir="ltr"
              defaultValue={supportSettings.phone}
              placeholder="01038434472"
              className="min-h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-sm font-black text-[#fff7e8] outline-none transition placeholder:text-white/24 focus:border-emerald-300/45 focus:ring-4 focus:ring-emerald-300/10"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-white/38">
              <MessageCircle className="size-3.5 text-emerald-300" aria-hidden />
              <span>الرابط الحالي:</span>
              <a href={toWhatsappHref(supportSettings.phone)} target="_blank" rel="noreferrer" className="text-emerald-300 underline-offset-4 hover:underline">
                {supportSettings.phone}
              </a>
            </div>
          </div>

          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 text-sm font-black text-[#07120d] transition hover:-translate-y-0.5 hover:bg-emerald-300">
            <Save className="size-4" aria-hidden />
            حفظ رقم الدعم
          </button>
        </form>

        {params.supportSaved ? (
          <div className="mx-5 mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200">
            تم تحديث رقم الدعم الفني بنجاح.
          </div>
        ) : null}
        {params.supportError ? (
          <div className="mx-5 mb-5 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-black text-red-200">
            {params.supportError}
          </div>
        ) : null}
      </section>
    </AdminPageShell>
  );
}
