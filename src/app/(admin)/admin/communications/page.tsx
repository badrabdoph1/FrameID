import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Headphones,
  Mail,
  MessageSquareText,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

export default async function AdminCommunicationsPage() {
  await requireAdminPermission("messages", "view");

  const [openSupportCases, unreadNotifications, messageOverrides] = await Promise.all([
    prisma.supportCase.count({ where: { status: { in: ["OPEN", "PENDING_CUSTOMER"] } } }),
    prisma.notification.count({ where: { deletedAt: null, readAt: null } }),
    prisma.featureFlag.count({ where: { key: "platform.subscription.experience.override", scope: "TENANT" } }),
  ]);
  const emailReady = Boolean(
    process.env.SMTP_HOST?.trim()
      && process.env.SMTP_USERNAME?.trim()
      && process.env.SMTP_PASSWORD?.trim()
      && process.env.SMTP_FROM_EMAIL?.trim(),
  );

  return (
    <AdminPageShell
      badge="التواصل"
      title="مركز التواصل"
      description="مكان واحد لرسائل العملاء والإشعارات وحالات الدعم وجاهزية البريد. اختر المهمة التي تريدها دون البحث بين صفحات متفرقة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "التواصل" }]}
    >
      <div className="grid gap-4">
        <section aria-label="ملخص التواصل" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="حالات دعم تحتاج متابعة" value={openSupportCases} icon={Headphones} tone={openSupportCases ? "warning" : "success"} />
          <Metric label="إشعارات غير مقروءة" value={unreadNotifications} icon={Bell} tone={unreadNotifications ? "warning" : "success"} />
          <Metric label="رسائل مخصصة للعملاء" value={messageOverrides} icon={MessageSquareText} tone="neutral" />
          <Metric label="خدمة البريد" value={emailReady ? "جاهزة" : "تحتاج إعدادًا"} icon={emailReady ? CheckCircle2 : TriangleAlert} tone={emailReady ? "success" : "warning"} />
        </section>

        <nav aria-label="أدوات التواصل" className="grid gap-3 md:grid-cols-2">
          <ToolLink href="/admin/messages" icon={MessageSquareText} title="رسائل الاشتراك والتفعيل" description="عدّل النصوص العامة والاستثناءات التي تظهر للعملاء حسب حالة الاشتراك." />
          <ToolLink href="/admin/notifications" icon={Bell} title="سجل الإشعارات" description="راجع الإشعارات ونتائجها وابحث في السجل من مكان واحد." />
          <ToolLink href="/admin/support" icon={Headphones} title="حالات الدعم" description="تابع الطلبات المفتوحة وانتقل مباشرة إلى ملف العميل المرتبط." />
          <ToolLink href="/admin/email" icon={Mail} title="تسليم البريد" description="تحقق من جاهزية SMTP واعرف حدود سجل التسليم الحالي بوضوح." />
        </nav>
      </div>
    </AdminPageShell>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: LucideIcon; tone: "success" | "warning" | "neutral" }) {
  const color = tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : "text-[#fff7e8]";
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Icon aria-hidden className={`size-5 ${color}`} />
      <p className="mt-3 text-xs font-black text-white/45">{label}</p>
      <p className={`mt-1 text-xl font-black ${color}`}>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
    </article>
  );
}

function ToolLink({ href, icon: Icon, title, description }: { href: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link href={href} className="group flex min-h-32 items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-white no-underline transition hover:border-violet-300/30 hover:bg-violet-300/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Icon aria-hidden className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base font-black text-[#fff7e8]">{title}</strong>
        <span className="mt-1 block text-sm font-bold leading-6 text-white/48">{description}</span>
      </span>
      <ArrowLeft aria-hidden className="mt-1 size-4 shrink-0 text-white/30 transition group-hover:-translate-x-1 group-hover:text-violet-200" />
    </Link>
  );
}
