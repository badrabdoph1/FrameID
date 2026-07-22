import { BadgeCheck, ShieldOff } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { grantAdminEntitlementAction, revokeAdminEntitlementSourceAction } from "../actions";

const inputClass = "min-h-10 rounded-lg border border-white/10 bg-black/15 px-3 text-xs font-bold text-white outline-none";

export const dynamic = "force-dynamic";

export default async function AdminServicesEntitlementsPage({ searchParams }: { searchParams: Promise<{ error?: string; granted?: string; revoked?: string }> }) {
  await requireAdminPermission("services", "view");
  const query = await searchParams;
  const [entitlements, tenants] = await Promise.all([
    prisma.entitlement.findMany({
      include: { tenant: { select: { displayName: true } }, product: { select: { name: true } }, offering: { select: { name: true } } },
      orderBy: { createdAt: "desc" }, take: 300,
    }),
    prisma.tenant.findMany({ where: { deletedAt: null }, select: { id: true, displayName: true }, orderBy: { displayName: "asc" }, take: 500 }),
  ]);
  return <div className="grid gap-5" dir="rtl"><header className="rounded-[1.6rem] border border-white/9 bg-white/[0.03] p-6"><p className="text-xs font-black text-[#f3cf73]">Entitlement Core</p><h1 className="mt-2 text-2xl font-black text-white">استحقاقات العملاء</h1><p className="mt-2 text-sm font-bold text-white/42">المصدر الحقيقي لقدرات العميل، مستقل عن Tenant Status وBilling Status.</p></header>{query.error ? <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}<form action={grantAdminEntitlementAction} className="grid gap-2 rounded-[1.4rem] border border-emerald-300/12 bg-emerald-400/[0.035] p-5 md:grid-cols-4"><select required name="tenantId" className={inputClass}><option value="">العميل</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName}</option>)}</select><input required name="capabilityKey" placeholder="capability.key" dir="ltr" className={inputClass} /><input name="entitlementValue" defaultValue="true" dir="ltr" className={inputClass} /><input name="sourceId" placeholder="source id (optional)" dir="ltr" className={inputClass} /><button className="min-h-10 rounded-lg bg-emerald-400/12 text-xs font-black text-emerald-100 md:col-span-4"><BadgeCheck className="ml-2 inline size-4" /> Grant يدوي مراقب</button></form><div className="overflow-x-auto rounded-[1.4rem] border border-white/8"><table className="min-w-full text-right text-xs"><thead className="bg-white/[0.04] text-white/40"><tr><th className="p-3">العميل</th><th className="p-3">Capability</th><th className="p-3">القيمة</th><th className="p-3">المصدر</th><th className="p-3">الحالة</th><th className="p-3">إجراء</th></tr></thead><tbody>{entitlements.map((item) => <tr key={item.id} className="border-t border-white/6 text-white/55"><td className="p-3 font-black text-white/70">{item.tenant.displayName}</td><td className="p-3 font-mono">{item.capabilityKey}</td><td className="p-3 font-mono">{JSON.stringify(item.value)}</td><td className="p-3">{item.sourceType}<br /><span className="text-white/25">{item.sourceId}</span></td><td className="p-3">{item.status}</td><td className="p-3">{item.status === "ACTIVE" ? <form action={revokeAdminEntitlementSourceAction}><input type="hidden" name="tenantId" value={item.tenantId} /><input type="hidden" name="sourceType" value={item.sourceType} /><input type="hidden" name="sourceId" value={item.sourceId} /><input type="hidden" name="reason" value="ADMIN_REVOKED" /><button className="inline-flex items-center gap-1 rounded-lg border border-red-300/15 px-2 py-1.5 font-black text-red-100"><ShieldOff className="size-3" /> Revoke source</button></form> : "—"}</td></tr>)}</tbody></table></div></div>;
}
