import Link from "next/link";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";
const riskyActions = ["CUSTOMER_PASSWORD_RESET", "CUSTOMER_DELETED", "SITE_SUSPENDED", "BACKUP_RESTORED", "FEATURE_FLAG_ENABLED", "FEATURE_FLAG_DELETED"];

export default async function AdminSecurityPage() {
  await requireAdminPermission("security", "view");
  const now = new Date();
  const [activeAdminSessions, revokedSessions, riskyEvents] = await Promise.all([
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: now }, user: { role: { not: "USER" } } } }),
    prisma.session.count({ where: { revokedAt: { not: null }, user: { role: { not: "USER" } } } }),
    prisma.auditLog.findMany({ where: { action: { in: riskyActions } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, action: true, entityType: true, entityId: true, actorId: true, createdAt: true } }),
  ]);
  return <AdminPageShell badge="النظام" title="الأمان" description="ملخص الجلسات الإدارية والعمليات الحساسة فقط؛ سجل التدقيق الكامل له صفحة مستقلة." breadcrumbs={[{ label: "النظام", href: "/admin/system" }, { label: "الأمان" }]} actions={[{ label: "فريق الإدارة", href: "/admin/admin-users", icon: UserCog }, { label: "سجل التدقيق", href: "/admin/audit", icon: ShieldCheck }]}><section className="grid gap-3 sm:grid-cols-3"><Metric label="جلسات إدارة نشطة" value={activeAdminSessions} icon={ShieldCheck} /><Metric label="جلسات ملغاة" value={revokedSessions} icon={KeyRound} /><Metric label="عمليات حساسة حديثة" value={riskyEvents.length} icon={UserCog} /></section><section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><header className="border-b border-white/8 p-4"><h2 className="font-black text-[#fff7e8]">آخر العمليات الحساسة</h2><p className="mt-1 text-xs font-bold text-white/42">لعرض كل الأحداث والمرشحات استخدم سجل التدقيق.</p></header><div className="grid divide-y divide-white/6">{riskyEvents.length === 0 ? <p className="p-8 text-center text-sm font-bold text-white/40">لا توجد عمليات حساسة مسجلة.</p> : riskyEvents.map((event) => <Link key={event.id} href={`/admin/audit?q=${encodeURIComponent(event.action)}`} className="grid gap-1 p-4 no-underline hover:bg-white/[0.04] sm:grid-cols-[1fr_auto] sm:items-center"><span><strong className="block text-sm font-black text-white/80">{event.action}</strong><small className="mt-1 block text-xs font-bold text-white/38">{event.entityType} · {event.entityId ?? "—"} · المنفذ: {event.actorId ?? "النظام"}</small></span><time className="text-xs font-bold text-white/35">{event.createdAt.toLocaleString("ar-EG")}</time></Link>)}</div></section></AdminPageShell>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ShieldCheck }) { return <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><Icon className="size-5 text-[#f3cf73]" /><p className="mt-3 text-2xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</p><p className="mt-1 text-xs font-black text-white/42">{label}</p></article>; }
