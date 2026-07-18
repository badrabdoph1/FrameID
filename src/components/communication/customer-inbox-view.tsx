import { Bell, ChevronLeft, Inbox, Megaphone } from "lucide-react";
import Link from "next/link";

import type { CommunicationInboxItem } from "@/modules/communication-center/prisma-queries";

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد المتابعة",
  WAITING_CUSTOMER: "بانتظار ردك",
  WAITING_INTERNAL: "قيد المراجعة الداخلية",
  RESOLVED: "تم الحل",
  CLOSED: "مغلق",
};

function relativeDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function CustomerInboxView({ items }: { items: CommunicationInboxItem[] }) {
  if (items.length === 0) {
    return (
      <section className="grid min-h-72 place-items-center rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-8 text-center">
        <div>
          <Inbox className="mx-auto size-11 text-white/25" aria-hidden />
          <h2 className="mt-4 text-xl font-black text-[#fff7e8]">صندوقك هادئ الآن</h2>
          <p className="mt-2 text-sm font-bold text-white/45">ستظهر هنا طلباتك وردود الفريق والإعلانات المهمة.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.035]">
      <div className="divide-y divide-white/8">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/communication/${item.id}`}
            className="group grid gap-3 p-4 no-underline transition hover:bg-white/[0.045] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5"
          >
            <span className={`grid size-11 place-items-center rounded-2xl ${item.unread ? "bg-amber-300/15 text-[#f3cf73]" : "bg-white/[0.05] text-white/38"}`}>
              {item.mode === "BROADCAST" ? <Megaphone className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-sm font-black text-[#fff7e8] sm:text-base">{item.subject}</strong>
                <small className="text-[0.68rem] font-black text-white/35">#{item.number}</small>
                {item.mode === "BROADCAST" ? <small className="rounded-full bg-violet-400/12 px-2 py-0.5 text-[0.65rem] font-black text-violet-200">إعلان</small> : null}
                {item.status ? <small className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.65rem] font-black text-white/55">{statusLabels[item.status] ?? item.status}</small> : null}
                {item.unread ? <span aria-label="رسالة غير مقروءة" className="size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(243,207,115,0.8)]" /> : null}
              </span>
              <span className="mt-1.5 block truncate text-xs font-bold text-white/44">
                {item.lastEntry?.body || (item.lastEntry?.kind === "STATE_CHANGE" ? "تم تحديث حالة الطلب" : "محادثة جديدة")}
              </span>
              <small className="mt-1 block text-[0.68rem] font-bold text-white/28">{relativeDate(item.lastActivityAt)}</small>
            </span>
            <span className="hidden items-center gap-2 text-xs font-black text-[#f3cf73] sm:flex">
              فتح
              <ChevronLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
