import { Megaphone, Plus } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

import { withdrawCommunicationBroadcastAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommunicationBroadcastsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPermission("messages", "view");
  const params = await searchParams;
  const campaigns = await prisma.communicationCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, status: true, recipientCount: true, scheduledAt: true, publishedAt: true, createdAt: true,
      conversation: { select: { id: true, number: true, subject: true, typeKey: true, audiences: { select: { deliveredAt: true } } } },
      createdBy: { select: { name: true } },
    },
  });
  return (
    <AdminPageShell badge="Broadcasts" title="الإعلانات" description="رسالة واحدة داخل Inbox مع Audience snapshot، بلا نسخ المحتوى لكل عميل." breadcrumbs={[{ label: "التواصل", href: "/admin/communications" }, { label: "الإعلانات" }]} actions={[{ label: "إعلان جديد", href: "/admin/communications/broadcasts/new", icon: Plus, variant: "primary" }]}>
      {params?.published ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم تجهيز الإعلان لـ {String(params.published)} عميل.</p> : null}
      {params?.withdrawn ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">تم سحب الإعلان من صناديق العملاء.</p> : null}
      {typeof params?.error === "string" ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">{decodeURIComponent(params.error)}</p> : null}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        {campaigns.length === 0 ? <div className="grid min-h-64 place-items-center text-center"><div><Megaphone className="mx-auto size-10 text-white/20" /><h2 className="mt-3 font-black text-white/70">لا توجد إعلانات بعد</h2></div></div> : <div className="divide-y divide-white/8">{campaigns.map((campaign) => {
          const delivered = campaign.conversation.audiences.filter((audience) => audience.deliveredAt).length;
          return <article key={campaign.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm font-black text-[#fff7e8]">{campaign.conversation.subject}</strong><span className="text-[0.65rem] font-black text-white/30">#{campaign.conversation.number}</span><span className="rounded-full bg-violet-300/10 px-2 py-0.5 text-[0.65rem] font-black text-violet-200">{campaign.status}</span></div><p className="mt-1 text-xs font-bold text-white/38">بواسطة {campaign.createdBy.name} · {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(campaign.createdAt)}</p></div><div className="grid gap-2 text-xs font-black text-white/45"><span><span className="text-emerald-300">{delivered}</span> / {campaign.recipientCount} وصل داخل المنصة</span>{campaign.status !== "WITHDRAWN" && campaign.status !== "CANCELLED" ? <form action={withdrawCommunicationBroadcastAction} className="flex gap-2"><input type="hidden" name="campaignId" value={campaign.id} /><input name="reason" required minLength={3} placeholder="سبب السحب" className="min-h-9 w-32 rounded-lg border border-white/10 bg-black/20 px-2 text-[0.68rem] text-white outline-none" /><button className="min-h-9 rounded-lg border border-red-300/20 bg-red-500/10 px-3 text-[0.68rem] font-black text-red-200">سحب</button></form> : null}</div></article>;
        })}</div>}
      </section>
    </AdminPageShell>
  );
}
