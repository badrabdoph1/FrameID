import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getContentRevisionHistory } from "@/lib/content/revisions";
import { restoreRevisionAction } from "@/app/(admin)/admin/revisions/actions";

export const dynamic = "force-dynamic";

export default async function AdminRevisionHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPermission("content", "view");
  const params = await searchParams;
  const revisions = await getContentRevisionHistory(100);

  return (
    <AdminPageShell
      badge="سجل التعديلات"
      title="سجل التعديلات"
      description="كل تعديل على محتوى المنصة يظهر هنا بقيمته قبل وبعد، مع رقم الحفظ البرمجي عند توفره."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "سجل التعديلات" }]}
    >
      {params.error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{params.error}</div> : null}
      {params.restored ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">تم إنشاء Commit لاستعادة الإصدار السابق وسيُطبق مع النشر.</div> : null}
      <div className="space-y-3">
        {revisions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center text-sm font-bold text-white/40">لا توجد تعديلات مسجلة بعد.</div>
        ) : revisions.map((revision) => (
          <article key={revision.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-[#fff7e8]">{revision.type}</h2>
                <p className="mt-1 text-xs font-bold text-white/45">بواسطة: {revision.actorName ?? revision.actorEmail ?? revision.actorId ?? "غير معروف"}</p>
                <p className="mt-1 text-xs font-mono text-white/30">{new Date(revision.createdAt).toLocaleString("ar-EG")}</p>
              </div>
              <AdminStatusBadge tone={revision.gitStatus === "committed" ? "success" : revision.gitStatus === "failed" ? "danger" : "warning"}>
                {revision.gitStatus === "committed" ? "محفوظ برمجيًا" : revision.gitStatus === "failed" ? "فشل الحفظ البرمجي" : "الحفظ البرمجي غير مهيأ"}
              </AdminStatusBadge>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <DiffBox title="قبل" value={revision.before} />
              <DiffBox title="بعد" value={revision.after} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/45">
              <span className="rounded-lg border border-white/10 px-2 py-1">رقم الحفظ: {revision.commitId ?? "—"}</span>
              {revision.gitError ? <span className="rounded-lg border border-red-500/20 px-2 py-1 text-red-300">{revision.gitError}</span> : null}
              {revision.before !== null && revision.before !== undefined ? <form action={restoreRevisionAction}><input type="hidden" name="revisionId" value={revision.id} /><button className="rounded-lg border border-amber-300/20 px-3 py-1.5 text-[#f3cf73] transition hover:bg-amber-300/10">استعادة قيمة «قبل»</button></form> : null}
            </div>
          </article>
        ))}
      </div>
    </AdminPageShell>
  );
}

function DiffBox({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <p className="mb-2 text-xs font-black text-white/50">{title}</p>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-white/55">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
