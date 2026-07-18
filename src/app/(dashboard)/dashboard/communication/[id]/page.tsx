import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConversationTimeline } from "@/components/communication/conversation-timeline";
import { ClearCustomerCommunicationDraft, CustomerReplyForm, MarkConversationReadOnMount } from "@/components/communication/customer-composer-form";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { communicationCenterQueries } from "@/modules/communication-center/runtime";

import { markCustomerConversationReadAction, replyToCustomerConversationAction, resolveCustomerConversationAction } from "../actions";

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد المتابعة",
  WAITING_CUSTOMER: "بانتظار ردك",
  WAITING_INTERNAL: "قيد المراجعة الداخلية",
  RESOLVED: "تم الحل",
  CLOSED: "مغلق",
};

export default async function CustomerConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const query = await searchParams;
  const detail = await communicationCenterQueries.getCustomerConversation({
    conversationId: id,
    tenantId: session.tenant.id,
    userId: session.user.id,
  });
  if (!detail) notFound();
  const wasUnread = detail.lastCustomerVisibleSequence > detail.lastReadSequence;

  const error = typeof query?.error === "string" ? query.error : null;
  const replyable = detail.mode === "DIRECT" && detail.replyMode !== "DISABLED";
  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      {query?.created ? <ClearCustomerCommunicationDraft draftKey="new" /> : null}
      {wasUnread ? <MarkConversationReadOnMount action={markCustomerConversationReadAction} conversationId={id} /> : null}
      <Link href="/dashboard/communication" className="inline-flex w-fit items-center gap-2 text-xs font-black text-white/50 no-underline hover:text-[#f3cf73]"><ArrowRight className="size-4" /> العودة للرسائل</Link>
      <header className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-black text-white/35"><span>#{detail.number}</span><span>·</span><span>{detail.mode === "BROADCAST" ? "إعلان" : "محادثة"}</span>{detail.workItem ? <><span>·</span><span className="text-[#f3cf73]">{statusLabels[detail.workItem.status] ?? detail.workItem.status}</span></> : null}</div>
        <h1 className="mt-2 text-2xl font-black text-[#fff7e8]">{detail.subject}</h1>
      </header>
      {query?.created ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم إنشاء الطلب وإرساله للفريق.</p> : null}
      {query?.sent ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم إرسال ردك.</p> : null}
      {query?.updated ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم تحديث حالة الطلب.</p> : null}
      {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">{decodeURIComponent(error)}</p> : null}
      <ConversationTimeline perspective="customer" entries={detail.entries} counterpartyLastReadSequence={detail.counterpartyLastReadSequence} />
      {detail.workItem?.status === "RESOLVED" ? (
        <section className="rounded-[1.5rem] border border-emerald-300/18 bg-emerald-400/[0.07] p-5">
          <h2 className="text-base font-black text-emerald-100">هل تم حل المشكلة؟</h2>
          <p className="mt-2 text-xs font-bold leading-6 text-white/45">تأكيدك يغلق الطلب مع الاحتفاظ بسجل المحادثة. وإذا ما زالت المشكلة موجودة سنعيدها للفريق.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <ResolutionButton conversationId={detail.id} resolved label="نعم، أغلق الطلب" />
            <ResolutionButton conversationId={detail.id} resolved={false} label="لا، أعد فتحه" />
          </div>
        </section>
      ) : null}
      {replyable ? (
        <CustomerReplyForm action={replyToCustomerConversationAction} conversationId={detail.id} clearDraft={Boolean(query?.sent)} />
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-center text-sm font-black text-white/45">هذه الرسالة للقراءة فقط.</p>
      )}
    </div>
  );
}

function ResolutionButton({ conversationId, resolved, label }: { conversationId: string; resolved: boolean; label: string }) {
  return <form action={resolveCustomerConversationAction}><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="resolved" value={String(resolved)} /><button className={`min-h-11 rounded-xl px-4 text-xs font-black ${resolved ? "bg-emerald-300 text-[#092016]" : "border border-white/10 bg-white/[0.04] text-white/65"}`}>{label}</button></form>;
}
