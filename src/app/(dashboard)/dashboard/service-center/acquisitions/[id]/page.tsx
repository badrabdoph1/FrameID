import { ArrowRight, Check, Circle, CreditCard, MessageCircle, Upload } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { cancelServiceAcquisitionAction, createServicesPaymentDraftAction, submitServicesPaymentAction } from "../../actions";

const stages = ["REQUESTED", "QUALIFYING", "AWAITING_PAYMENT", "PAID", "FULFILLING", "FULFILLED"] as const;
const labels: Record<string, string> = {
  DRAFT: "مسودة", REQUESTED: "تم استلام الطلب", QUALIFYING: "مراجعة المتطلبات", ACCEPTED: "تم القبول",
  AWAITING_PAYMENT: "بانتظار الدفع", PAID: "تم اعتماد الدفع", FULFILLING: "قيد التنفيذ", FULFILLED: "تم التسليم",
  DECLINED: "مرفوض", CANCELLED: "ملغي", REFUNDED: "تم الاسترداد", SUBMITTED: "أُرسل للمراجعة",
  UNDER_REVIEW: "قيد مراجعة الدفع", APPROVED: "دفع معتمد", REJECTED: "مرفوض", DRAFT_PAYMENT: "مسودة دفع",
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export const dynamic = "force-dynamic";

export default async function ServiceAcquisitionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; requested?: string; submitted?: string; cancelled?: string }> }) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const query = await searchParams;
  const [acquisition, accounts] = await Promise.all([
    prisma.acquisition.findFirst({
      where: { id, tenantId: session.tenant.id },
      include: {
        offering: { include: { product: { select: { name: true, code: true } } } },
        lines: { orderBy: { createdAt: "asc" } },
        paymentRequests: { where: { deletedAt: null }, include: { paymentAccount: true, proofAsset: true }, orderBy: { createdAt: "desc" } },
        fulfillmentRuns: { orderBy: { createdAt: "desc" } },
        productInstances: true,
      },
    }),
    prisma.paymentAccount.findMany({ where: { isActive: true, deletedAt: null }, orderBy: [{ method: "asc" }, { sortOrder: "asc" }] }),
  ]);
  if (!acquisition) notFound();
  const latestPayment = acquisition.paymentRequests[0] ?? null;
  const currentIndex = acquisition.status === "ACCEPTED" ? 1 : stages.indexOf(acquisition.status as typeof stages[number]);
  const terminal = ["DECLINED", "CANCELLED", "REFUNDED"].includes(acquisition.status);
  const canCancel = ["DRAFT", "REQUESTED", "QUALIFYING", "ACCEPTED", "AWAITING_PAYMENT"].includes(acquisition.status);

  return (
    <div className="grid gap-5" dir="rtl">
      <Link href="/dashboard/service-center?view=requests" className="inline-flex w-fit items-center gap-2 text-xs font-black text-white/45 no-underline hover:text-[#f3cf73]"><ArrowRight className="size-4" /> كل الطلبات</Link>
      <header className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black text-[#f3cf73]">طلب #{acquisition.id.slice(-8)}</p><h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{acquisition.offering.name}</h1><p className="mt-2 text-sm font-bold text-white/42">{acquisition.offering.product?.name ?? "خدمة FrameID"} · {acquisition.createdAt.toLocaleDateString("ar-EG")}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${terminal ? "bg-red-400/10 text-red-100" : "bg-amber-300/12 text-[#f3cf73]"}`}>{labels[acquisition.status] ?? acquisition.status}</span></div>{acquisition.conversationId ? <Link href={`/dashboard/communication/${acquisition.conversationId}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300/18 bg-emerald-400/9 px-4 text-sm font-black text-emerald-100 no-underline hover:bg-emerald-400/15"><MessageCircle className="size-4" /> فتح محادثة الطلب</Link> : null}</header>

      {query.error ? <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}
      {query.requested ? <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/9 p-4 text-sm font-bold text-emerald-100">تم إنشاء الطلب وربطه بمركز التواصل.</div> : null}
      {query.submitted ? <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/9 p-4 text-sm font-bold text-emerald-100">تم إرسال إثبات الدفع للمراجعة.</div> : null}

      <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5"><h2 className="text-lg font-black text-white">مسار الطلب</h2><div className="mt-5 grid gap-0 sm:grid-cols-6">{stages.map((stage, index) => { const done = !terminal && currentIndex >= index; return <div key={stage} className="relative flex gap-3 pb-5 sm:grid sm:justify-items-center sm:gap-2 sm:pb-0"><span className={`z-10 grid size-8 shrink-0 place-items-center rounded-full border ${done ? "border-emerald-300/30 bg-emerald-400/14 text-emerald-200" : "border-white/10 bg-[#11141a] text-white/25"}`}>{done ? <Check className="size-4" /> : <Circle className="size-3" />}</span><span className={`text-xs font-black ${done ? "text-white/70" : "text-white/28"}`}>{labels[stage]}</span>{index < stages.length - 1 ? <span className={`absolute right-4 top-8 h-[calc(100%-1rem)] w-px sm:right-[calc(50%+1rem)] sm:top-4 sm:h-px sm:w-[calc(100%-2rem)] ${done && currentIndex > index ? "bg-emerald-300/25" : "bg-white/8"}`} /> : null}</div>; })}</div></section>

      {acquisition.status === "AWAITING_PAYMENT" ? <section className="rounded-[1.6rem] border border-amber-300/16 bg-amber-300/[0.045] p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><CreditCard className="size-5" /></span><div><p className="text-xs font-black text-[#f3cf73]">الخطوة التالية</p><h2 className="text-lg font-black text-white">إتمام الدفع</h2></div>{acquisition.acceptedTotal != null && acquisition.acceptedCurrency ? <strong className="mr-auto text-xl font-black text-[#f3cf73]">{money(acquisition.acceptedTotal, acquisition.acceptedCurrency)}</strong> : null}</div>
        {!latestPayment ? <div className="mt-5 grid gap-3"><p className="text-sm font-bold text-white/45">اختر الحساب الذي ستحوّل إليه. سنثبت السعر الموجود في الطلب ولن نعتمد أي قيمة مرسلة من المتصفح.</p><div className="grid gap-2 md:grid-cols-2">{accounts.map((account) => <form action={createServicesPaymentDraftAction} key={account.id} className="rounded-xl border border-white/9 bg-black/10 p-4"><input type="hidden" name="acquisitionId" value={acquisition.id} /><input type="hidden" name="method" value={account.method} /><input type="hidden" name="paymentAccountId" value={account.id} /><p className="font-black text-white">{account.displayName || account.label || account.method}</p><p className="mt-1 text-xs font-bold text-white/40">{account.accountIdentifier || account.accountNumber}</p><input name="reference" className="mt-3 w-full rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm text-white outline-none focus:border-amber-300/30" placeholder="مرجع التحويل (اختياري)" /><button type="submit" className="mt-3 min-h-10 w-full rounded-lg bg-[#f3cf73] px-3 text-sm font-black text-[#17130a]">اختيار هذا الحساب</button></form>)}</div></div> : latestPayment.status === "DRAFT" ? <form action={submitServicesPaymentAction} className="mt-5 grid gap-3" encType="multipart/form-data"><input type="hidden" name="acquisitionId" value={acquisition.id} /><input type="hidden" name="paymentRequestId" value={latestPayment.id} /><div className="rounded-xl border border-white/9 bg-black/10 p-4"><p className="text-sm font-black text-white">حوّل إلى: {latestPayment.paymentAccount?.displayName || latestPayment.method}</p><p className="mt-1 text-xs font-bold text-white/40">{latestPayment.paymentAccount?.accountIdentifier || latestPayment.paymentAccount?.accountNumber}</p></div><label className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-center"><Upload className="size-5 text-[#f3cf73]" /><span className="text-sm font-black text-white">اختر صورة إثبات الدفع</span><span className="text-xs font-bold text-white/35">JPEG أو PNG أو WebP — حد أقصى 5MB</span><input required name="proof" type="file" accept="image/jpeg,image/png,image/webp" className="text-xs text-white/45" /></label><button type="submit" className="min-h-12 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17130a]">رفع الإثبات وإرساله للمراجعة</button></form> : <div className="mt-5 rounded-xl border border-blue-300/16 bg-blue-400/8 p-4"><p className="font-black text-blue-100">{labels[latestPayment.status] ?? latestPayment.status}</p><p className="mt-1 text-sm font-bold text-white/42">سنحدّث الطلب تلقائيًا بعد مراجعة فريق FrameID.</p></div>}
      </section> : null}

      {acquisition.fulfillmentRuns.length ? <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.025] p-5"><h2 className="text-lg font-black text-white">التنفيذ والتسليم</h2><div className="mt-3 grid gap-2">{acquisition.fulfillmentRuns.map((run) => <div key={run.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] p-3"><span className="text-sm font-black text-white/60">{run.workflowKey}</span><span className="text-xs font-black text-white/38">{labels[run.status] ?? run.status}</span></div>)}</div></section> : null}
      {acquisition.productInstances.length ? <section className="rounded-[1.6rem] border border-emerald-300/15 bg-emerald-400/[0.05] p-5"><p className="text-xs font-black text-emerald-200">تم التفعيل</p><h2 className="mt-1 text-lg font-black text-white">الخدمة موجودة داخل حسابك</h2><p className="mt-2 text-sm font-bold text-white/42">{acquisition.productInstances.map((item) => item.instanceKey).join(" · ")}</p></section> : null}
      {canCancel ? <form action={cancelServiceAcquisitionAction} className="justify-self-end"><input type="hidden" name="acquisitionId" value={acquisition.id} /><button type="submit" className="rounded-xl border border-red-300/15 bg-red-500/7 px-4 py-2 text-xs font-black text-red-100/70 hover:bg-red-500/12">إلغاء الطلب</button></form> : null}
    </div>
  );
}
