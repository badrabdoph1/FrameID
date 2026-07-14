import Link from "next/link";
import { Bell, CheckCircle2, Mail, ShieldCheck, TriangleAlert } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  await requireAdminCenter("notifications");
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPassword = process.env.SMTP_PASSWORD?.trim();
  const sender = process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  const configured = Boolean(smtpHost && smtpUser && smtpPassword && sender);

  return (
    <AdminPageShell
      badge="التواصل"
      title="حالة إرسال البريد"
      description="تحقق من جاهزية خدمة البريد. لا يسجل النظام حاليًا كل محاولة تسليم، لذلك لا نعرض إشعارات المنصة كسجل بريد مضلل."
      breadcrumbs={[{ label: "التواصل", href: "/admin/messages" }, { label: "البريد" }]}
      actions={[{ label: "سجل الإشعارات", href: "/admin/notifications", icon: Bell }, { label: "سجل التدقيق", href: "/admin/audit?q=EMAIL", icon: ShieldCheck }]}
    >
      <section className={configured ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/8 p-5" : "rounded-3xl border border-amber-400/20 bg-amber-400/8 p-5"}>
        <div className="flex items-start gap-3">
          <span className={configured ? "grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/12 text-emerald-300" : "grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-400/12 text-amber-300"}>{configured ? <CheckCircle2 className="size-5" /> : <TriangleAlert className="size-5" />}</span>
          <div><h2 className="text-lg font-black text-[#fff7e8]">{configured ? "خدمة البريد مهيأة" : "إعداد البريد غير مكتمل"}</h2><p className="mt-1 text-sm font-bold leading-6 text-white/52">{configured ? "بيانات الاتصال والمرسل موجودة. لا تظهر كلمات المرور أو القيم السرية في لوحة الإدارة." : "أكمل إعدادات SMTP في بيئة التشغيل حتى تعمل رسائل استعادة كلمة المرور والرسائل النظامية."}</p></div>
        </div>
      </section>

      <section aria-label="ملخص إعداد البريد" className="grid gap-3 sm:grid-cols-2">
        <Status label="خادم الإرسال" ready={Boolean(smtpHost)} value={smtpHost ? "محدد" : "غير محدد"} />
        <Status label="حساب الإرسال" ready={Boolean(smtpUser && smtpPassword)} value={smtpUser && smtpPassword ? "محدد ومحمي" : "غير مكتمل"} />
        <Status label="عنوان المرسل" ready={Boolean(sender)} value={sender ?? "غير محدد"} />
        <Status label="سجل التسليم" ready={false} value="غير متاح في النظام الحالي" />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2"><Mail className="size-4 text-[#f3cf73]" /><h2 className="font-black text-[#fff7e8]">الحدود الحالية</h2></div>
        <p className="mt-2 text-sm font-bold leading-6 text-white/48">لمتابعة أخطاء أو أحداث مرتبطة بالبريد استخدم سجل التدقيق. إضافة سجل تسليم كامل تتطلب تخزين نتيجة كل محاولة من مزود البريد، وهي قدرة خلفية مستقلة وليست مجرد واجهة.</p>
        <Link href="/admin/audit?q=EMAIL" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-black text-white/70 no-underline hover:bg-white/5">فتح سجل التدقيق</Link>
      </section>
    </AdminPageShell>
  );
}

function Status({ label, ready, value }: { label: string; ready: boolean; value: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-black text-white/65">{label}</h2><span className={ready ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-amber-400/10 px-2.5 py-1 text-[0.68rem] font-black text-amber-300"}>{ready ? "جاهز" : "يحتاج إعدادًا"}</span></div><p className="mt-2 break-all text-sm font-bold text-white/45">{value}</p></article>;
}
