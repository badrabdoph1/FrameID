import type { ReactNode } from "react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import type { CustomerIssueDetail } from "@/modules/customer-issues/admin-queries";
import type { CustomerIssuePriority, CustomerIssueStatus } from "@/modules/customer-issues/types";
import { IssueActions } from "./issue-actions";

const statusLabels: Record<CustomerIssueStatus, string> = {
  NEW: "جديد",
  IN_REVIEW: "قيد المراجعة",
  RESOLVED: "محلول",
  CLOSED: "مغلق",
};

const priorityLabels: Record<CustomerIssuePriority, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  CRITICAL: "حرجة",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function sourceLocation(issue: CustomerIssueDetail): string {
  const occurrence = issue.latestOccurrence;
  if (!occurrence?.sourceFile) return "غير محدد";
  const line = occurrence.sourceLine ? `:${occurrence.sourceLine}` : "";
  const column = occurrence.sourceColumn ? `:${occurrence.sourceColumn}` : "";
  return `${occurrence.sourceFile}${line}${column}`;
}

function copyPayload(issue: CustomerIssueDetail): string {
  return JSON.stringify({
    issue: issue.number,
    status: issue.status,
    priority: issue.priority,
    customer: issue.customer,
    tenant: issue.tenant,
    site: issue.site,
    title: issue.title,
    route: issue.latestOccurrence?.route,
    sourceLocation: sourceLocation(issue),
    requestId: issue.latestOccurrence?.requestId,
    correlationId: issue.latestOccurrence?.correlationId,
    stack: issue.latestOccurrence?.stack,
    metadata: issue.latestOccurrence?.metadata,
  }, null, 2);
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs font-black text-white/38">{label}</p>
      <div className="mt-1 text-sm font-bold text-white/80">{value || "—"}</div>
    </div>
  );
}

export function CustomerIssueDetailView({ issue }: { issue: CustomerIssueDetail }) {
  const occurrence = issue.latestOccurrence;
  return (
    <AdminPageShell
      badge="مشاكل العملاء"
      title={`بلاغ ${issue.number}`}
      description={issue.title}
      backHref="/admin/errors"
      backLabel="رجوع لمشاكل العملاء"
    >
      <IssueActions issue={issue} copyPayload={copyPayload(issue)} />

      <section className="grid gap-3 md:grid-cols-4">
        <Field label="حالة البلاغ" value={<span>{statusLabels[issue.status]}</span>} />
        <Field label="الأولوية" value={<span>{priorityLabels[issue.priority]}</span>} />
        <Field label="تاريخ الإنشاء" value={formatDate(issue.createdAt)} />
        <Field label="آخر تحديث" value={formatDate(issue.updatedAt)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-base font-black text-[#fff7e8]">العميل</h2>
          <p className="mt-3 font-black text-white">{issue.customer?.name ?? "زائر غير مسجل"}</p>
          {issue.customer?.email ? <p className="mt-1 text-sm font-bold text-white/48">{issue.customer.email}</p> : null}
          {issue.customer?.phone ? <p className="mt-1 text-sm font-bold text-white/48">{issue.customer.phone}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-base font-black text-[#fff7e8]">الموقع</h2>
          <p className="mt-3 font-black text-white">{issue.site?.title ?? issue.tenant?.name ?? "غير مرتبط"}</p>
          {issue.site?.slug ? <p className="mt-1 text-sm font-bold text-white/48">/{issue.site.slug}</p> : null}
          {issue.site?.templateCode ? <p className="mt-1 text-sm font-bold text-white/48">Template: {issue.site.templateCode}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-base font-black text-[#fff7e8]">المراجع</h2>
          <p className="mt-3 text-sm font-bold text-white/70">{issue.assigneeName ?? "غير مسند"}</p>
          <p className="mt-1 text-sm font-bold text-white/48">حل بواسطة: {issue.resolvedByName ?? "—"}</p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Field label="نوع الخطأ" value={occurrence?.errorType ?? issue.title} />
        <Field label="Route" value={<span className="font-mono text-xs">{occurrence?.route ?? "—"}</span>} />
        <Field label="الكود المتأثر" value={sourceLocation(issue)} />
        <Field label="Browser / Device / OS" value={[occurrence?.browser, occurrence?.device, occurrence?.os].filter(Boolean).join(" / ")} />
        <Field label="Environment" value={[occurrence?.environment, occurrence?.buildVersion, occurrence?.releaseVersion].filter(Boolean).join(" · ")} />
        <Field label="آخر Action" value={occurrence?.lastAction ?? "—"} />
      </section>

      <section id="occurrences" className="grid gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-base font-black text-[#fff7e8]">Stack Trace</h2>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/35 p-4 text-xs leading-6 text-white/58">{occurrence?.stack ?? "—"}</pre>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-base font-black text-[#fff7e8]">Metadata</h2>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-black/35 p-4 text-xs leading-6 text-white/58">{JSON.stringify(occurrence?.metadata ?? {}, null, 2)}</pre>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-base font-black text-[#fff7e8]">سجل الحركة</h2>
        <div className="mt-3 grid gap-2">
          {issue.events.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-sm font-bold text-white/62">
              <span className="text-white/85">{event.type}</span>
              {event.fromStatus || event.toStatus ? <span>{event.fromStatus ?? "—"} → {event.toStatus ?? "—"}</span> : null}
              {event.actorName ? <span>بواسطة {event.actorName}</span> : null}
              <span className="text-white/35">{formatDate(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
