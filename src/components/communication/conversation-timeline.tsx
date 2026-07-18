import { FileImage, LockKeyhole, UserRound } from "lucide-react";

import type { CommunicationTimelineEntry } from "@/modules/communication-center/prisma-queries";

function entryLabel(entry: CommunicationTimelineEntry): string {
  if (entry.kind === "INTERNAL_NOTE") return "ملاحظة داخلية";
  if (entry.kind === "STATE_CHANGE") return "تحديث الحالة";
  if (entry.kind === "ASSIGNMENT") return "تحديث المسؤول";
  if (entry.kind === "SYSTEM_EVENT") return "تحديث من النظام";
  return entry.authorType === "CUSTOMER" ? "العميل" : entry.authorType === "ADMIN" ? "فريق FrameID" : "النظام";
}

export function ConversationTimeline({
  entries,
  perspective,
  counterpartyLastReadSequence = 0,
}: {
  entries: CommunicationTimelineEntry[];
  perspective: "customer" | "admin";
  counterpartyLastReadSequence?: number;
}) {
  const visibleEntries = perspective === "customer"
    ? entries.filter((entry) => entry.visibility === "CUSTOMER_AND_ADMIN")
    : entries;

  return (
    <section className="grid gap-4" aria-label="سجل المحادثة">
      {visibleEntries.map((entry) => {
        const internal = entry.visibility === "ADMIN_ONLY";
        const customer = entry.authorType === "CUSTOMER";
        const ownVisibleMessage = !internal && (perspective === "customer" ? customer : entry.authorType === "ADMIN");
        const readLabel = perspective === "customer" ? "قرأها الفريق" : "قرأها العميل";
        return (
          <article
            key={entry.id}
            className={`relative rounded-[1.35rem] border p-4 sm:p-5 ${
              internal
                ? "border-amber-300/20 bg-amber-300/[0.07]"
                : customer
                  ? "border-sky-300/16 bg-sky-400/[0.07]"
                  : "border-white/10 bg-white/[0.035]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-white/[0.06] text-white/55">
                  {internal ? <LockKeyhole className="size-4" aria-hidden /> : <UserRound className="size-4" aria-hidden />}
                </span>
                <div>
                  <strong className="block text-xs font-black text-[#fff7e8]">{entry.authorName}</strong>
                  <small className={`text-[0.65rem] font-black ${internal ? "text-amber-200" : "text-white/35"}`}>{entryLabel(entry)}</small>
                </div>
              </div>
              <time className="text-[0.68rem] font-bold text-white/30" dateTime={entry.createdAt.toISOString()}>
                {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)}
              </time>
            </div>
            {entry.body ? <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7 text-white/72">{entry.body}</p> : null}
            {entry.attachments.length > 0 ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {entry.attachments.map((attachment) => (
                  attachment.scanStatus === "CLEAN" ? (
                    <a
                      key={attachment.id}
                      href={`/api/communication/attachments/${attachment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 text-xs font-black text-white/65 no-underline hover:border-amber-300/25 hover:text-[#f3cf73]"
                    >
                      <FileImage className="size-4" aria-hidden />
                      <span className="truncate">{attachment.originalName}</span>
                    </a>
                  ) : (
                    <span key={attachment.id} className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 text-xs font-black text-white/35">
                      <FileImage className="size-4" aria-hidden />
                      جاري فحص {attachment.originalName}
                    </span>
                  )
                ))}
              </div>
            ) : null}
            {ownVisibleMessage ? (
              <p className="mt-3 text-[0.65rem] font-black text-white/30">
                {counterpartyLastReadSequence >= entry.sequence ? readLabel : "أُرسلت"}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
