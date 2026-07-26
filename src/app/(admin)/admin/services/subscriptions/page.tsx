import { CalendarClock, RefreshCw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { manageServiceSubscriptionAction } from "../actions";

const inputClass = "min-h-9 rounded-lg border border-white/10 bg-black/15 px-3 text-xs font-bold text-white outline-none";
const statusAr: Record<string, string> = { TRIALING: "تجريبي", ACTIVE: "نشط", PAST_DUE: "متأخر", GRACE_PERIOD: "مهلة", CANCELLED: "ملغي", EXPIRED: "منتهي", SUSPENDED: "معلق" };

export const dynamic = "force-dynamic";

export default async function AdminServiceSubscriptionsPage({ searchParams }: { searchParams: Promise<{ error?: string; status?: string }> }) {
  await requireAdminPermission("services", "view");
  const query = await searchParams;
  const statuses = ["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "CANCELLED", "EXPIRED", "SUSPENDED"];
  const status = query.status && statuses.includes(query.status) ? query.status as "ACTIVE" : undefined;
  const subscriptions = await prisma.serviceSubscription.findMany({
    where: status ? { status } : {},
    include: { tenant: { select: { displayName: true } }, offering: { select: { name: true, code: true } } },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
  return <div className="grid gap-5" dir="rtl">
    <header className="rounded-[1.6rem] border border-white/9 bg-white/[0.03] p-6"><p className="text-xs font-black text-[#f3cf73]">Recurring Services</p><h1 className="mt-2 text-2xl font-black text-white">اشتراكات الخدمات</h1><p className="mt-2 text-sm font-bold text-white/42">اشتراكات مستقلة عن خطة الحساب الأساسية، مع التجديد والمهلة والإلغاء.</p></header>
    {query.error ? <div role="alert" className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}
    <nav className="flex flex-wrap gap-2"><a href="/admin/services/subscriptions" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/55 no-underline">الكل</a>{statuses.map((item) => <a key={item} href={`/admin/services/subscriptions?status=${item}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/55 no-underline">{statusAr[item]}</a>)}</nav>
    <div className="grid gap-3">{subscriptions.map((subscription) => <article key={subscription.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><span className="grid size-11 place-items-center rounded-xl bg-blue-400/10 text-blue-100"><CalendarClock className="size-5" /></span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-white">{subscription.offering.name}</h2><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[0.65rem] font-black text-white/55">{statusAr[subscription.status]}</span>{subscription.cancelAtPeriodEnd ? <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[0.65rem] font-black text-amber-100">يتوقف نهاية الفترة</span> : null}</div><p className="mt-2 text-xs font-bold text-white/35">{subscription.tenant.displayName} · {subscription.currentPeriodStart.toLocaleDateString("ar-EG")} — {subscription.currentPeriodEnd.toLocaleDateString("ar-EG")}</p></div><div className="flex flex-wrap gap-2"><form action={manageServiceSubscriptionAction} className="flex gap-2"><input type="hidden" name="subscriptionId" value={subscription.id} /><input type="hidden" name="operation" value="RENEW" /><input name="days" type="number" min="1" max="366" defaultValue="30" className={`${inputClass} w-20`} /><button className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-400/10 px-3 text-xs font-black text-emerald-100"><RefreshCw className="size-3" /> تجديد</button></form>{subscription.status === "PAST_DUE" ? <form action={manageServiceSubscriptionAction} className="flex gap-2"><input type="hidden" name="subscriptionId" value={subscription.id} /><input type="hidden" name="operation" value="GRACE" /><input name="days" type="number" min="1" max="30" defaultValue="7" className={`${inputClass} w-20`} /><button className="rounded-lg border border-blue-300/15 px-3 text-xs font-black text-blue-100">مهلة</button></form> : null}{!["CANCELLED", "EXPIRED"].includes(subscription.status) ? <form action={manageServiceSubscriptionAction} className="flex gap-2"><input type="hidden" name="subscriptionId" value={subscription.id} /><input type="hidden" name="operation" value="CANCEL" /><input required name="reason" placeholder="سبب الإلغاء" className={inputClass} /><button className="rounded-lg border border-red-300/15 px-3 text-xs font-black text-red-100">إلغاء</button></form> : null}</div></div></article>)}</div>
  </div>;
}
