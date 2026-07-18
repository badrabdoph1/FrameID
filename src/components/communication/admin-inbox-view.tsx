import { AlertTriangle, ChevronLeft, Inbox } from "lucide-react";
import Link from "next/link";

import type { AdminInboxItem } from "@/modules/communication-center/prisma-queries";

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  IN_PROGRESS: "قيد العمل",
  WAITING_CUSTOMER: "بانتظار العميل",
  WAITING_INTERNAL: "بانتظار داخلي",
  RESOLVED: "تم الحل",
  CLOSED: "مغلق",
};

const priorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة",
};

export function AdminInboxView({ items, total }: { items: AdminInboxItem[]; total: number }) {
  if (items.length === 0) {
    return (
      <section className="grid min-h-72 place-items-center rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-8 text-center">
        <div>
          <Inbox className="mx-auto size-10 text-white/25" aria-hidden />
          <h2 className="mt-4 text-lg font-black text-[#fff7e8]">لا توجد محادثات مطابقة</h2>
          <p className="mt-2 text-sm font-bold text-white/42">غيّر الفلاتر أو انتظر وصول طلب جديد.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035]">
      <header className="border-b border-white/8 px-4 py-3 text-xs font-black text-white/40">{total.toLocaleString("ar-EG")} محادثة</header>
      <div className="divide-y divide-white/8">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/communications/${item.id}`} className="group grid gap-3 p-4 no-underline transition hover:bg-white/[0.045] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                {item.unread ? <span aria-label="غير مقروء" className="size-2 rounded-full bg-violet-300" /> : null}
                <strong className="truncate text-sm font-black text-[#fff7e8]">{item.subject}</strong>
                <small className="text-[0.65rem] font-black text-white/30">#{item.number}</small>
                {item.status ? <small className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.65rem] font-black text-white/60">{statusLabels[item.status] ?? item.status}</small> : null}
                {item.priority ? (
                  <small className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-black ${item.priority === "URGENT" ? "bg-red-500/15 text-red-200" : "bg-white/[0.05] text-white/45"}`}>
                    {item.priority === "URGENT" ? <AlertTriangle className="size-3" aria-hidden /> : null}
                    {priorityLabels[item.priority] ?? item.priority}
                  </small>
                ) : null}
              </span>
              <span className="mt-1.5 block text-xs font-black text-[#f3cf73]">{item.customerName}</span>
              <span className="mt-1 block truncate text-xs font-bold text-white/38">{item.lastEntry?.body || "لا يوجد نص ظاهر"}</span>
            </span>
            <span className="flex items-center justify-between gap-4 text-[0.68rem] font-bold text-white/30 lg:justify-end">
              <time>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(item.lastActivityAt)}</time>
              <ChevronLeft className="size-4 text-white/30 transition group-hover:-translate-x-1 group-hover:text-[#f3cf73]" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
