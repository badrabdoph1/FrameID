import { CreditCard, Headphones, MessageCircle, Save, Share2, UsersRound } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getSupportSettings, toWhatsappHref } from "@/modules/support/support-settings";
import { updateSupportWhatsappAction } from "@/app/(admin)/admin/settings/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ supportSaved?: string; supportError?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  await requireAdminPermission("settings", "view");
  const params = await searchParams;
  const supportSettings = await getSupportSettings();

  return (
    <AdminPageShell
      badge="الإعدادات"
      title="إعدادات المنصة"
      description="وجهة واحدة للإعدادات التي يمكن تعديلها فعليًا في النظام."
    >
      <nav aria-label="أقسام الإعدادات" className="grid gap-3 md:grid-cols-3">
        <SettingsLink href="/admin/settings/payment" title="وسائل الدفع" description="الحسابات وQR وطرق التحويل." icon={CreditCard} />
        <SettingsLink href="/admin/social-preview" title="معاينة المشاركة" description="عنوان ووصف وصورة الروابط." icon={Share2} />
        <SettingsLink href="/admin/admin-users" title="فريق الإدارة" description="الحسابات والجلسات والصلاحيات." icon={UsersRound} />
      </nav>

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

function SettingsLink({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: typeof CreditCard }) {
  return <a href={href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/25 hover:bg-amber-300/8"><Icon className="size-5 text-[#f3cf73]" /><h2 className="mt-3 font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-sm font-bold text-white/45">{description}</p></a>;
}
