import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Bell, CheckCircle2, MessageSquareText, Send, Users, Wand2 } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  ACTIVATION_TEMPLATE_CATEGORY,
  CUSTOMER_BROADCAST_CATEGORY,
  activationTemplateDefinitions,
  parseActivationTemplatePayload,
  validateMessageTone,
} from "@/modules/messages/customer-message-config";
import { saveActivationTemplateAction, sendCustomerMessageAction } from "@/app/(admin)/admin/messages/actions";

export const dynamic = "force-dynamic";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/8 [&>option]:bg-[#111318] [&>option]:text-[#fff7e8]";

type Props = {
  searchParams: Promise<{ sent?: string; templateSaved?: string; error?: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function toneLabel(tone: string) {
  if (tone === "success") return "نجاح";
  if (tone === "warning") return "تنبيه";
  if (tone === "danger") return "خطر";
  return "معلومة";
}

function toneClass(tone: string) {
  if (tone === "success") return "bg-emerald-400/10 text-emerald-300 border-emerald-300/20";
  if (tone === "warning") return "bg-amber-400/10 text-amber-300 border-amber-300/20";
  if (tone === "danger") return "bg-red-400/10 text-red-300 border-red-300/20";
  return "bg-sky-400/10 text-sky-300 border-sky-300/20";
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  await requireAdminPermission("messages", "view");
  const params = await searchParams;

  const [tenants, recentMessages, storedTemplates, totalMessages] = await Promise.all([
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        displayName: true,
        status: true,
        owner: { select: { email: true, name: true } },
        _count: { select: { sites: true, payments: true } },
      },
    }),
    prisma.notificationLog.findMany({
      where: { category: CUSTOMER_BROADCAST_CATEGORY, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, title: true, body: true, tenantId: true, createdAt: true },
    }),
    prisma.notificationLog.findMany({
      where: { category: ACTIVATION_TEMPLATE_CATEGORY, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, body: true, createdAt: true },
    }),
    prisma.notificationLog.count({ where: { category: CUSTOMER_BROADCAST_CATEGORY, deletedAt: null } }),
  ]);

  const templateMap = new Map(storedTemplates.map((template) => [template.title, template]));
  const banner = params.error
    ? { tone: "danger" as const, text: params.error }
    : params.sent
      ? { tone: "success" as const, text: `تم إرسال الرسالة إلى ${Number(params.sent).toLocaleString("ar-EG")} عميل.` }
      : params.templateSaved
        ? { tone: "success" as const, text: "تم حفظ رسالة التفعيل بنجاح." }
        : null;

  return (
    <AdminPageShell
      badge="الرسائل"
      title="الرسائل"
      description="إرسال رسائل تظهر داخل لوحة العميل، وإدارة نصوص رسائل التفعيل والمراجعة والرفض بدون تعديل كود."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الرسائل" }]}
      actions={[{ label: "سجل الإشعارات", href: "/admin/notifications", icon: Bell }]}
    >
      <div className="grid gap-4">
        {banner ? (
          <div className={banner.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>
            {banner.text}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="عملاء متاحين" value={tenants.length} icon={Users} />
          <MetricCard label="رسائل مرسلة" value={totalMessages} icon={MessageSquareText} />
          <MetricCard label="قوالب التفعيل" value={activationTemplateDefinitions.length} icon={Wand2} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="إرسال رسالة للعملاء" description="الرسالة ستظهر داخل لوحة العميل مثل تنبيهات التفعيل، ويمكن إرسالها للكل أو لعملاء محددين.">
            <form action={sendCustomerMessageAction} className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">عنوان الرسالة</span>
                  <input name="title" required placeholder="مثال: تحديث مهم في المنصة" className={inputClass} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-black text-white/42">نوع الرسالة</span>
                  <select name="tone" defaultValue="info" className={inputClass}>
                    <option value="info">معلومة</option>
                    <option value="success">نجاح</option>
                    <option value="warning">تنبيه</option>
                    <option value="danger">مهم / خطر</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-black text-white/42">نص الرسالة</span>
                <textarea name="body" required rows={4} placeholder="اكتب الرسالة التي ستظهر للعميل داخل لوحة التحكم…" className={`${inputClass} min-h-[110px] resize-y py-3`} />
              </label>

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/16 p-3">
                <p className="text-sm font-black text-[#fff7e8]">المستلمين</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/70">
                    <input type="radio" name="audience" value="selected" defaultChecked />
                    عملاء محددين
                  </label>
                  <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-amber-500/18 bg-amber-500/8 px-3 text-sm font-black text-[#f3cf73]">
                    <input type="radio" name="audience" value="all" />
                    إرسال للكل مرة واحدة
                  </label>
                </div>

                <div className="mt-2 grid max-h-[340px] gap-2 overflow-y-auto pr-1 admin-scrollbar">
                  {tenants.map((tenant) => (
                    <label key={tenant.id} className="grid min-h-14 cursor-pointer grid-cols-[auto,1fr,auto] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 transition hover:border-amber-300/20 hover:bg-amber-300/8">
                      <input type="checkbox" name="tenantIds" value={tenant.id} />
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-black text-[#fff7e8]">{tenant.displayName}</strong>
                        <small className="mt-0.5 block truncate text-xs font-bold text-white/40">{tenant.owner.email}</small>
                      </span>
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/42">{tenant.status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5">
                <Send className="size-4" />
                إرسال الرسالة
              </button>
            </form>
          </Panel>

          <Panel title="آخر الرسائل المرسلة" description="متابعة سريعة لآخر رسائل ظهرت داخل لوحات العملاء.">
            <div className="grid gap-2">
              {recentMessages.length === 0 ? (
                <EmptyState text="لا توجد رسائل مرسلة حتى الآن." />
              ) : recentMessages.map((message) => (
                <Link key={message.id} href="/admin/notifications" className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/22 hover:bg-amber-300/8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-black text-[#fff7e8]">{message.title}</strong>
                      <small className="mt-1 block text-xs font-bold text-white/38">{formatDate(message.createdAt)}</small>
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${toneClass(message.type)}`}>{toneLabel(message.type)}</span>
                  </div>
                  {message.body ? <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-white/48">{message.body}</p> : null}
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section id="templates" className="scroll-mt-32">
          <Panel title="رسائل التفعيل والمراجعة" description="غير النصوص التي تظهر للعميل عند طلب التفعيل، انتظار المراجعة، التفعيل الناجح، الرفض، أو انتهاء الاشتراك.">
            <div className="grid gap-3 lg:grid-cols-2">
              {activationTemplateDefinitions.map((definition) => {
                const stored = templateMap.get(definition.key);
                const tone = validateMessageTone(stored?.type ?? definition.tone);
                const payload = parseActivationTemplatePayload(stored?.body, {
                  title: definition.defaultTitle,
                  body: definition.defaultBody,
                });
                return (
                  <form key={definition.key} action={saveActivationTemplateAction} className="grid gap-3 rounded-3xl border border-white/10 bg-black/16 p-4">
                    <input type="hidden" name="key" value={definition.key} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-[#fff7e8]">{definition.label}</h3>
                        <p className="mt-1 text-xs font-bold text-white/38">آخر تحديث: {stored ? formatDate(stored.createdAt) : "القيمة الافتراضية"}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-black ${toneClass(tone)}`}>{toneLabel(tone)}</span>
                    </div>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">عنوان الرسالة</span>
                      <input name="title" defaultValue={payload.title} required className={inputClass} />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">النص الذي يظهر للعميل</span>
                      <textarea name="body" defaultValue={payload.body} required rows={3} className={`${inputClass} min-h-[92px] resize-y py-3`} />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-black text-white/42">شكل التنبيه</span>
                      <select name="tone" defaultValue={tone} className={inputClass}>
                        <option value="info">معلومة</option>
                        <option value="success">نجاح</option>
                        <option value="warning">تنبيه</option>
                        <option value="danger">خطر</option>
                      </select>
                    </label>

                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-[#f3cf73] transition hover:bg-amber-300/10">
                      <CheckCircle2 className="size-4" />
                      حفظ الرسالة
                    </button>
                  </form>
                );
              })}
            </div>
          </Panel>
        </section>
      </div>
    </AdminPageShell>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <Icon className="size-5 text-[#f3cf73]" />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</p>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <header className="border-b border-white/8 p-4">
        <h2 className="text-lg font-black text-[#fff7e8]">{title}</h2>
        <p className="mt-1 text-sm font-bold leading-7 text-white/45">{description}</p>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center text-sm font-bold text-white/40">{text}</div>;
}
