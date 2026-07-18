import { randomUUID } from "node:crypto";

import { ArrowRight, Clock3, Send, StickyNote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConversationTimeline } from "@/components/communication/conversation-timeline";
import { MarkConversationReadOnMount } from "@/components/communication/customer-composer-form";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { communicationCenterQueries } from "@/modules/communication-center/runtime";

import { manageAdminConversationAction, markAdminConversationReadAction } from "../actions";

const transitions: Record<string, string[]> = {
  NEW: ["IN_PROGRESS", "WAITING_CUSTOMER"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "WAITING_INTERNAL", "RESOLVED"],
  WAITING_CUSTOMER: ["IN_PROGRESS"],
  WAITING_INTERNAL: ["IN_PROGRESS"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: ["IN_PROGRESS"],
};
const statusLabels: Record<string, string> = { NEW: "جديد", IN_PROGRESS: "قيد العمل", WAITING_CUSTOMER: "بانتظار العميل", WAITING_INTERNAL: "بانتظار داخلي", RESOLVED: "تم الحل", CLOSED: "مغلق" };

export default async function AdminConversationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPermission("support", "view");
  const { id } = await params;
  const query = await searchParams;
  const detail = await communicationCenterQueries.getAdminConversation(id);
  if (!detail) notFound();
  const assignees = await prisma.adminUser.findMany({ where: { role: { in: ["SUPER_ADMIN", "OPERATIONS_ADMIN", "SUPPORT_AGENT"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const error = typeof query?.error === "string" ? query.error : null;

  return (
    <AdminPageShell
      badge={`#${detail.number}`}
      title={detail.subject}
      description={detail.tenant ? `${detail.tenant.displayName} — ${detail.tenant.ownerEmail}` : "محادثة عامة"}
      breadcrumbs={[{ label: "التواصل", href: "/admin/communications" }, { label: `#${detail.number}` }]}
      backHref="/admin/communications"
      backLabel="صندوق التواصل"
    >
      {detail.lastSequence > 0 ? <MarkConversationReadOnMount action={markAdminConversationReadAction} conversationId={id} /> : null}
      {query?.updated ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم حفظ التحديث.</p> : null}
      {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">{decodeURIComponent(error)}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <ConversationTimeline perspective="admin" entries={detail.entries} counterpartyLastReadSequence={detail.counterpartyLastReadSequence} />
          {detail.mode === "DIRECT" && detail.replyMode !== "DISABLED" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Composer operation="reply" conversationId={detail.id} title="رد للعميل" icon={Send} />
              <Composer operation="note" conversationId={detail.id} title="ملاحظة داخلية" icon={StickyNote} internal />
            </div>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          {detail.workItem ? (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h2 className="text-sm font-black text-[#fff7e8]">إدارة الطلب</h2>
                <p className="mt-2 text-xs font-bold text-white/40">الحالة الحالية: <strong className="text-[#f3cf73]">{statusLabels[detail.workItem.status]}</strong></p>
                <div className="mt-3 grid gap-2">
                  {transitions[detail.workItem.status]?.map((status) => (
                    <form key={status} action={manageAdminConversationAction}>
                      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                      <input type="hidden" name="conversationId" value={detail.id} /><input type="hidden" name="operation" value="status" /><input type="hidden" name="status" value={status} />
                      <button className="min-h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/65 hover:bg-white/[0.08]">{statusLabels[status]}</button>
                    </form>
                  ))}
                </div>
              </section>
              <form action={manageAdminConversationAction} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <input type="hidden" name="conversationId" value={detail.id} /><input type="hidden" name="operation" value="priority" />
                <label className="text-xs font-black text-white/55">الأولوية</label>
                <select name="priority" defaultValue={detail.workItem.priority} className="min-h-10 rounded-xl border border-white/10 bg-[#11141b] px-3 text-xs font-black text-white"><option value="LOW">منخفضة</option><option value="NORMAL">عادية</option><option value="HIGH">مرتفعة</option><option value="URGENT">عاجلة</option></select>
                <button className="min-h-10 rounded-xl bg-violet-300 text-xs font-black text-[#17111f]">حفظ الأولوية</button>
              </form>
              <form action={manageAdminConversationAction} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <input type="hidden" name="conversationId" value={detail.id} /><input type="hidden" name="operation" value="assignee" />
                <label className="text-xs font-black text-white/55">المسؤول</label>
                <select name="assigneeAdminUserId" defaultValue={detail.workItem.assigneeAdminUserId ?? ""} className="min-h-10 rounded-xl border border-white/10 bg-[#11141b] px-3 text-xs font-black text-white"><option value="">غير معيّن</option>{assignees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                <button className="min-h-10 rounded-xl bg-violet-300 text-xs font-black text-[#17111f]">حفظ المسؤول</button>
              </form>
            </>
          ) : null}
          {detail.tenant ? <Link href={`/admin/customers/${detail.tenant.id}`} className="inline-flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/65 no-underline hover:text-[#f3cf73]">ملف العميل <ArrowRight className="size-4" /></Link> : null}
          {detail.contexts.length > 0 ? <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><h2 className="text-xs font-black text-white/55">السياق المرتبط</h2><div className="mt-3 grid gap-2">{detail.contexts.map((context) => <div key={context.id} className="rounded-xl bg-black/15 p-3 text-[0.68rem] font-bold text-white/42"><strong className="block text-white/65">{context.namespace}/{context.entityType}</strong><span className="break-all">{context.entityId}</span></div>)}</div></section> : null}
          {detail.workItem?.waitingSince ? <p className="flex items-center gap-2 text-[0.68rem] font-bold text-white/32"><Clock3 className="size-3.5" /> منذ {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(detail.workItem.waitingSince)}</p> : null}
        </aside>
      </div>
    </AdminPageShell>
  );
}

function Composer({ operation, conversationId, title, icon: Icon, internal = false }: { operation: "reply" | "note"; conversationId: string; title: string; icon: typeof Send; internal?: boolean }) {
  return (
    <form action={manageAdminConversationAction} className={`grid gap-3 rounded-2xl border p-4 ${internal ? "border-amber-300/18 bg-amber-300/[0.06]" : "border-white/10 bg-white/[0.035]"}`}>
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="operation" value={operation} />
      <h2 className="flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Icon className="size-4" /> {title}</h2>
      <textarea name="body" required rows={5} maxLength={20000} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-bold leading-6 text-white outline-none focus:border-violet-300/35" placeholder={internal ? "لن تظهر هذه الملاحظة للعميل" : "اكتب ردًا واضحًا..."} />
      <input type="file" name="attachments" multiple accept="image/jpeg,image/png,image/webp" className="text-[0.68rem] font-bold text-white/35 file:rounded-lg file:border-0 file:bg-white/10 file:px-2 file:py-1.5 file:text-white" />
      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-violet-300 px-3 text-xs font-black text-[#17111f]"><Icon className="size-4" /> حفظ</button>
    </form>
  );
}
