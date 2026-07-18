import { MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomerInboxView } from "@/components/communication/customer-inbox-view";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { communicationCenterQueries } from "@/modules/communication-center/runtime";

export default async function CustomerCommunicationInboxPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const cursor = typeof params?.cursor === "string" ? params.cursor : null;
  const inbox = await communicationCenterQueries.listCustomerInbox({
    tenantId: session.tenant.id,
    userId: session.user.id,
    cursor,
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black text-[#f3cf73]">مركز التواصل</p>
          <h1 className="mt-1 text-2xl font-black text-[#fff7e8]">رسائلك وطلباتك في مكان واحد</h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-white/45">تابع ردود الفريق، الطلبات، والتنبيهات المهمة من نفس السجل.</p>
        </div>
        <Link href="/dashboard/communication/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17130a] no-underline transition hover:bg-[#ffe39a]">
          <MessageSquarePlus className="size-4" aria-hidden />
          طلب جديد
        </Link>
      </header>

      <CustomerInboxView items={inbox.items} />
      {inbox.nextCursor ? (
        <Link href={`/dashboard/communication?cursor=${encodeURIComponent(inbox.nextCursor)}`} className="mx-auto rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/55 no-underline hover:bg-white/[0.05]">عرض الأقدم</Link>
      ) : null}
    </div>
  );
}
