import { ArrowLeft, ClipboardList, MessageCircle } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { setAcquisitionDecisionAction, setCustomQuoteAction, startAcquisitionFulfillmentAction } from "../actions";

const statusAr: Record<string, string> = { DRAFT: "مسودة", REQUESTED: "جديد", QUALIFYING: "تأهيل", ACCEPTED: "مقبول", AWAITING_PAYMENT: "بانتظار الدفع", PAID: "مدفوع", FULFILLING: "قيد التنفيذ", FULFILLED: "مكتمل", DECLINED: "مرفوض", CANCELLED: "ملغي", REFUNDED: "مسترد" };
const inputClass = "min-h-10 rounded-lg border border-white/10 bg-black/15 px-3 text-xs font-bold text-white outline-none";

export const dynamic = "force-dynamic";

export default async function AdminServiceAcquisitionsPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  await requireAdminPermission("services", "view");
  const query = await searchParams;
  const status = query.status && ["REQUESTED", "QUALIFYING", "AWAITING_PAYMENT", "PAID", "FULFILLING", "FULFILLED", "DECLINED", "CANCELLED", "REFUNDED"].includes(query.status) ? query.status : null;
  const acquisitions = await prisma.acquisition.findMany({
    where: status ? { status: status as "REQUESTED" } : {},
    include: {
      tenant: { select: { displayName: true, owner: { select: { name: true, email: true } } } },
      offering: { select: { name: true, code: true, type: true, salesMode: true } },
      paymentRequests: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
      fulfillmentRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="grid gap-5" dir="rtl">
      <header className="rounded-[1.6rem] border border-white/9 bg-white/[0.03] p-6"><p className="text-xs font-black text-[#f3cf73]">Acquisition</p><h1 className="mt-2 text-2xl font-black text-white">طلبات الخدمات</h1><p className="mt-2 text-sm font-bold text-white/42">التأهيل، عروض الأسعار، الدفع، ثم التسليم دون إنشاء نظام طلبات موازٍ.</p></header>
      {query.error ? <div role="alert" className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}
      <nav className="flex flex-wrap gap-2"><Link href="/admin/services/acquisitions" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/55 no-underline">الكل</Link>{["REQUESTED", "QUALIFYING", "AWAITING_PAYMENT", "PAID", "FULFILLING", "FULFILLED"].map((item) => <Link key={item} href={`/admin/services/acquisitions?status=${item}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/55 no-underline">{statusAr[item]}</Link>)}</nav>
      <div className="grid gap-3">{acquisitions.map((acquisition) => <article key={acquisition.id} className="rounded-[1.4rem] border border-white/8 bg-white/[0.025] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-[#f3cf73]"><ClipboardList className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-white">{acquisition.offering.name}</h2><span className="rounded-full bg-white/[0.055] px-2 py-1 text-[0.62rem] font-black text-white/55">{statusAr[acquisition.status]}</span><span className="rounded-full bg-blue-400/8 px-2 py-1 text-[0.62rem] font-black text-blue-100">{acquisition.offering.type}</span></div><p className="mt-2 text-xs font-bold text-white/38">{acquisition.tenant.displayName} · {acquisition.tenant.owner.name} · {acquisition.createdAt.toLocaleString("ar-EG")}</p><p className="mt-1 text-xs font-bold text-white/28">#{acquisition.id} · {acquisition.correlationId}</p></div><div className="flex flex-wrap gap-2">{acquisition.conversationId ? <Link href={`/admin/communications/${acquisition.conversationId}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-400/8 px-3 text-xs font-black text-emerald-100 no-underline"><MessageCircle className="size-4" /> المحادثة</Link> : null}{["PAID", "ACCEPTED"].includes(acquisition.status) ? <form action={startAcquisitionFulfillmentAction}><input type="hidden" name="acquisitionId" value={acquisition.id} /><button className="min-h-10 rounded-lg bg-[#f3cf73] px-3 text-xs font-black text-[#17130a]">بدء التنفيذ</button></form> : null}</div></div>
          <div className="mt-4 grid gap-3 border-t border-white/7 pt-4 xl:grid-cols-2"><div className="flex flex-wrap gap-2">{["REQUESTED", "QUALIFYING"].includes(acquisition.status) ? <>{acquisition.status === "REQUESTED" ? <form action={setAcquisitionDecisionAction}><input type="hidden" name="acquisitionId" value={acquisition.id} /><input type="hidden" name="target" value="QUALIFYING" /><button className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-black text-white/60">بدء التأهيل</button></form> : null}<form action={setAcquisitionDecisionAction}><input type="hidden" name="acquisitionId" value={acquisition.id} /><input type="hidden" name="target" value="ACCEPTED" /><button className="min-h-9 rounded-lg border border-emerald-300/15 bg-emerald-400/8 px-3 text-xs font-black text-emerald-100">قبول بدون دفع</button></form><form action={setAcquisitionDecisionAction} className="flex gap-2"><input type="hidden" name="acquisitionId" value={acquisition.id} /><input type="hidden" name="target" value="DECLINED" /><input name="reason" placeholder="سبب الرفض" className={inputClass} /><button className="min-h-9 rounded-lg border border-red-300/15 px-3 text-xs font-black text-red-100">رفض</button></form></> : null}</div>{["REQUESTED", "QUALIFYING", "ACCEPTED"].includes(acquisition.status) ? <form action={setCustomQuoteAction} className="grid grid-cols-[1fr_5rem_auto] gap-2"><input type="hidden" name="acquisitionId" value={acquisition.id} /><input required name="amount" type="number" step="0.01" placeholder="عرض السعر" className={inputClass} /><input name="currency" defaultValue="EGP" className={inputClass} /><button className="rounded-lg bg-blue-400/10 px-3 text-xs font-black text-blue-100">اعتماد العرض</button></form> : null}</div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-white/35">{acquisition.acceptedTotal != null ? <span>القيمة: {(acquisition.acceptedTotal / 100).toLocaleString("ar-EG")} {acquisition.acceptedCurrency}</span> : null}{acquisition.paymentRequests[0] ? <span>الدفع: {acquisition.paymentRequests[0].status}</span> : null}{acquisition.fulfillmentRuns[0] ? <span>التنفيذ: {acquisition.fulfillmentRuns[0].status}</span> : null}<Link href={`/dashboard/service-center/acquisitions/${acquisition.id}`} className="mr-auto inline-flex items-center gap-1 text-[#f3cf73] no-underline">عرض العميل <ArrowLeft className="size-3" /></Link></div>
        </article>)}</div>
    </div>
  );
}
