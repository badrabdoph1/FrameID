import { Filter, Megaphone, Search } from "lucide-react";
import Link from "next/link";

import { AdminInboxView } from "@/components/communication/admin-inbox-view";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { communicationCenterQueries } from "@/modules/communication-center/runtime";
import type { CommunicationPriority, CommunicationWorkItemStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const statuses = new Set<CommunicationWorkItemStatus>(["NEW", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_INTERNAL", "RESOLVED", "CLOSED"]);
const priorities = new Set<CommunicationPriority>(["LOW", "NORMAL", "HIGH", "URGENT"]);

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function AdminCommunicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminPermission("support", "view");
  const params = await searchParams;
  const statusValue = single(params?.status) as CommunicationWorkItemStatus | undefined;
  const priorityValue = single(params?.priority) as CommunicationPriority | undefined;
  const filters = {
    search: single(params?.search),
    status: statusValue && statuses.has(statusValue) ? statusValue : undefined,
    priority: priorityValue && priorities.has(priorityValue) ? priorityValue : undefined,
    queueKey: single(params?.queue),
    assigneeAdminUserId: single(params?.assignee),
    typeKey: single(params?.type),
    cursor: single(params?.cursor),
    adminUserId: admin.id,
  };
  const inbox = await communicationCenterQueries.listAdminInbox(filters);

  return (
    <AdminPageShell
      badge="Communication Inbox"
      title="مركز التواصل"
      description="صندوق العمل الموحد لطلبات العملاء والرسائل والملاحظات والتصعيد، مرتب حسب آخر نشاط."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "التواصل" }]}
      actions={[{ label: "إعلان جديد", href: "/admin/communications/broadcasts/new", icon: Megaphone, variant: "primary" }]}
    >
      <form className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(9rem,auto))_auto]" method="get">
        <label className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <input name="search" defaultValue={filters.search} placeholder="رقم الطلب، العنوان، العميل أو البريد" className="min-h-11 w-full rounded-xl border border-white/10 bg-black/15 pr-10 pl-3 text-sm font-bold text-white outline-none focus:border-violet-300/35" />
        </label>
        <select name="status" defaultValue={filters.status ?? ""} className="min-h-11 rounded-xl border border-white/10 bg-[#11141b] px-3 text-xs font-black text-white">
          <option value="">كل الحالات</option><option value="NEW">جديد</option><option value="IN_PROGRESS">قيد العمل</option><option value="WAITING_CUSTOMER">بانتظار العميل</option><option value="WAITING_INTERNAL">بانتظار داخلي</option><option value="RESOLVED">تم الحل</option><option value="CLOSED">مغلق</option>
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="min-h-11 rounded-xl border border-white/10 bg-[#11141b] px-3 text-xs font-black text-white">
          <option value="">كل الأولويات</option><option value="URGENT">عاجلة</option><option value="HIGH">مرتفعة</option><option value="NORMAL">عادية</option><option value="LOW">منخفضة</option>
        </select>
        <input name="queue" defaultValue={filters.queueKey} placeholder="الطابور" className="min-h-11 rounded-xl border border-white/10 bg-black/15 px-3 text-xs font-black text-white outline-none" />
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 text-xs font-black text-[#17111f]"><Filter className="size-4" /> تطبيق</button>
      </form>

      <AdminInboxView items={inbox.items} total={inbox.total} />
      {inbox.nextCursor ? (
        <Link href={`/admin/communications?cursor=${encodeURIComponent(inbox.nextCursor)}`} className="mx-auto rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/55 no-underline hover:bg-white/[0.05]">عرض الأقدم</Link>
      ) : null}
    </AdminPageShell>
  );
}
