import Link from "next/link";
import { Bell, Mail, Search, ShieldCheck } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; type?: string; state?: string }>;
};

function dateLabel(value: Date): string {
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminEmailPage({ searchParams }: Props) {
  await requireAdminCenter("notifications");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type = (params.type ?? "").trim();
  const state = (params.state ?? "").trim();

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    where.OR = [{ id: contains }, { title: contains }, { body: contains }, { type: contains }, { category: contains }, { tenantId: contains }, { userId: contains }];
  }
  if (type) where.type = { contains: type, mode: "insensitive" };
  if (state === "read") where.readAt = { not: null };
  if (state === "unread") where.readAt = null;

  const [logs, total, unread, types] = await Promise.all([
    prisma.notificationLog.findMany({ where: where as never, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.notificationLog.count({ where: { deletedAt: null } }),
    prisma.notificationLog.count({ where: { deletedAt: null } }),
    prisma.notificationLog.groupBy({ by: ["type"], _count: true, orderBy: { _count: { type: "desc" } }, take: 8 }),
  ]);

  return (
    <AdminPageShell
      badge="Communication"
      title="Email & Notification Delivery Center"
      description="مركز مراقبة رسائل النظام والإشعارات التي تم إنشاؤها للمستخدمين والعملاء."
      breadcrumbs={[{ label: "النظام", href: "/admin" }, { label: "Email Center" }]}
      actions={[{ label: "Notifications", href: "/admin/notifications", icon: Bell }, { label: "Audit", href: "/admin/audit?q=NOTIFICATION", icon: ShieldCheck }]}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل الرسائل" value={total} />
        <Metric label="غير مقروءة" value={unread} accent />
        <Metric label="المعروض الآن" value={logs.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="grid h-fit gap-4">
          <form action="/admin/email" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Search className="size-4 text-amber-300" /> فلاتر</h2>
            <div className="grid gap-3">
              <input name="q" defaultValue={q} placeholder="بحث في العنوان أو النوع أو العميل" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
              <input name="type" defaultValue={type} placeholder="type" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
              <select name="state" defaultValue={state} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
                <option value="">كل الحالات</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <button className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white">تطبيق</button>
            </div>
          </form>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="text-sm font-black text-[#fff7e8]">أكثر الأنواع</h2>
            <div className="mt-3 grid gap-2">
              {types.map((item) => <Link key={item.type} href={`/admin/email?type=${encodeURIComponent(item.type)}`} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/16 px-3 py-2 text-xs font-bold text-white/55 no-underline transition hover:border-amber-500/20 hover:text-amber-200"><span>{item.type}</span><strong>{item._count}</strong></Link>)}
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-white/8 bg-black/18 px-4 py-3 text-xs font-black text-white/38 lg:grid">
            <span>الرسالة</span><span>الهدف</span><span>النوع</span><span>الوقت</span>
          </div>
          <div className="grid divide-y divide-white/6">
            {logs.length === 0 ? <p className="px-4 py-12 text-center text-sm font-bold text-white/35">لا توجد رسائل مطابقة.</p> : logs.map((log) => (
              <article key={log.id} className="grid gap-2 px-4 py-3 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr] lg:items-center">
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-white/82">{log.title}</strong>
                  <p className="mt-1 truncate text-xs font-bold text-white/35">{log.body ?? "—"}</p>
                </div>
                <span className="truncate font-mono text-xs font-bold text-white/38">{log.tenantId ?? "system"}</span>
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] font-black text-white/42">{log.type}{log.category ? ` · ${log.category}` : ""}</span>
                <span className="text-xs font-bold text-white/32">{dateLabel(log.createdAt)}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Mail className={accent ? "size-5 text-amber-300" : "size-5 text-white/35"} />
      <p className={accent ? "mt-3 text-2xl font-black text-amber-200" : "mt-3 text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}
