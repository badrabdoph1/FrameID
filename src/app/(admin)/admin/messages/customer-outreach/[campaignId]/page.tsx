import { ArrowLeft, Search, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function CustomerOutreachRecipientsPage({ params, searchParams }: Props) {
  await requireAdminPermission("messages", "view");
  const [{ campaignId }, query] = await Promise.all([params, searchParams]);
  const search = query.q?.trim().slice(0, 120) ?? "";
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const campaign = await prisma.customerMessageCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, body: true, status: true, createdAt: true, createdByName: true, _count: { select: { recipients: true } } },
  });
  if (!campaign) notFound();

  const where = {
    campaignId,
    ...(search ? {
      OR: [
        { tenantName: { contains: search, mode: "insensitive" as const } },
        { ownerName: { contains: search, mode: "insensitive" as const } },
        { ownerEmail: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };
  const [recipients, filteredCount] = await Promise.all([
    prisma.customerMessageRecipient.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { tenant: { select: { status: true } } },
    }),
    prisma.customerMessageRecipient.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <AdminPageShell
      badge="سجل المستلمين"
      title={campaign.title}
      description={`أسماء وبيانات من استلموا الرسالة وقت إرسالها · ${campaign._count.recipients.toLocaleString("ar-EG")} مستلم`}
      breadcrumbs={[
        { label: "الرسائل", href: "/admin/messages" },
        { label: "مراسلة العميل", href: "/admin/messages/customer-outreach" },
        { label: "المستلمون" },
      ]}
    >
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${campaign.status === "ACTIVE" ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.06] text-white/45"}`}>{campaign.status === "ACTIVE" ? "ظاهرة الآن" : "متوقفة"}</span><span className="text-[0.68rem] font-bold text-white/30">{campaign.createdByName} · {campaign.createdAt.toLocaleString("ar-EG")}</span></div><p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-white/60">{campaign.body}</p></div>
          <Link href="/admin/messages/customer-outreach" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-white/65"><ArrowLeft className="size-4" />العودة للحملات</Link>
        </div>

        <form className="mt-5 flex flex-col gap-2 sm:flex-row" action={`/admin/messages/customer-outreach/${campaign.id}`}>
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" /><input name="q" defaultValue={search} aria-label="بحث المستلمين" placeholder="ابحث باسم العميل أو المالك أو البريد" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-3 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-sky-300/35" /></label>
          <button className="min-h-11 rounded-xl bg-sky-300 px-5 text-xs font-black text-[#08202b]">بحث</button>
        </form>

        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {recipients.map((recipient) => <article key={recipient.id} className="flex items-start gap-3 rounded-2xl border border-white/7 bg-black/15 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-300/8 text-sky-200"><Users className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-sm font-black text-white/75">{recipient.tenantName}</strong><small className="mt-1 block truncate text-xs font-bold text-white/40">{recipient.ownerName}</small><small className="block truncate text-[0.7rem] font-bold text-white/28">{recipient.ownerEmail}</small><small className="mt-2 block text-[0.65rem] font-black text-white/32">{recipient.tenant?.status ?? "العميل محذوف من النظام"}</small></span></article>)}
          {!recipients.length ? <div className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm font-black text-white/35">لا يوجد مستلم يطابق هذا البحث.</div> : null}
        </div>

        {pageCount > 1 ? <nav aria-label="صفحات المستلمين" className="mt-5 flex items-center justify-between border-t border-white/8 pt-4"><PaginationLink campaignId={campaign.id} search={search} page={page - 1} disabled={page <= 1}>السابق</PaginationLink><span className="text-xs font-black text-white/40">صفحة {page.toLocaleString("ar-EG")} من {pageCount.toLocaleString("ar-EG")}</span><PaginationLink campaignId={campaign.id} search={search} page={page + 1} disabled={page >= pageCount}>التالي</PaginationLink></nav> : null}
      </section>
    </AdminPageShell>
  );
}

function PaginationLink({ campaignId, search, page, disabled, children }: { campaignId: string; search: string; page: number; disabled: boolean; children: string }) {
  if (disabled) return <span aria-disabled="true" className="rounded-xl border border-white/6 px-4 py-2 text-xs font-black text-white/20">{children}</span>;
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("q", search);
  return <Link href={`/admin/messages/customer-outreach/${campaignId}?${query}`} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/65">{children}</Link>;
}
