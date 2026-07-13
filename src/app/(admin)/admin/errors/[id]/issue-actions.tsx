import { CheckCircle2, FolderOpen, RefreshCw, RotateCcw, Send, UserRound } from "lucide-react";
import Link from "next/link";

import { closeIssueAction, notifyCustomerResolvedAction, reopenIssueAction, resolveIssueAction, startReviewAction } from "../actions";
import { CopyIssueDetailsButton } from "./copy-issue-details-button";
import type { CustomerIssueDetail } from "@/modules/customer-issues/admin-queries";

export function IssueActions({ issue, copyPayload }: { issue: CustomerIssueDetail; copyPayload: string }) {
  const source = issue.latestOccurrence;
  const fileHref = source?.sourceFile
    ? `/admin/code?file=${encodeURIComponent(source.sourceFile)}${source.sourceLine ? `&line=${source.sourceLine}` : ""}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={startReviewAction.bind(null, issue.id)}>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:bg-[#ffe08a]">
          <RefreshCw className="size-4" aria-hidden />
          بدء المراجعة
        </button>
      </form>
      <form action={resolveIssueAction.bind(null, issue.id)}>
        <input type="hidden" name="resolutionNote" value="تم حل المشكلة من مركز مشاكل العملاء" />
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/16">
          <CheckCircle2 className="size-4" aria-hidden />
          تعليم كمحلول
        </button>
      </form>
      <form action={reopenIssueAction.bind(null, issue.id)}>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 text-sm font-black text-amber-100 transition hover:bg-amber-300/16">
          <RotateCcw className="size-4" aria-hidden />
          إعادة فتح
        </button>
      </form>
      <form action={closeIssueAction.bind(null, issue.id)}>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/65 transition hover:bg-white/10">
          إغلاق البلاغ
        </button>
      </form>
      <form action={notifyCustomerResolvedAction.bind(null, issue.id)}>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-blue-400/10 px-4 text-sm font-black text-blue-100 transition hover:bg-blue-400/16">
          <Send className="size-4" aria-hidden />
          إخطار العميل بالحل
        </button>
      </form>
      <CopyIssueDetailsButton payload={copyPayload} />
      {issue.customer ? (
        <Link href={`/admin/customers/${issue.customer.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/10 hover:text-white">
          <UserRound className="size-4" aria-hidden />
          فتح العميل
        </Link>
      ) : null}
      {issue.site ? (
        <Link href={`/admin/sites/${issue.site.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/10 hover:text-white">
          <FolderOpen className="size-4" aria-hidden />
          فتح الموقع
        </Link>
      ) : null}
      <Link href="#occurrences" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/10 hover:text-white">
        فتح سجل الأخطاء
      </Link>
      {fileHref ? (
        <Link href={fileHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/10 hover:text-white">
          فتح الملف البرمجي
        </Link>
      ) : null}
    </div>
  );
}
