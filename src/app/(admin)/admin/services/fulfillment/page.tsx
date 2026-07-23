import { Activity, Play, RotateCcw } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { completeManualFulfillmentAction, retryFailedFulfillmentAction, startAcquisitionFulfillmentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminServicesFulfillmentPage({ searchParams }: { searchParams: Promise<{ error?: string; started?: string }> }) {
  await requireAdminPermission("services", "view");
  const query = await searchParams;
  const [runs, ready] = await Promise.all([
    prisma.fulfillmentRun.findMany({
      include: { acquisition: { include: { tenant: { select: { displayName: true } }, offering: { select: { name: true } } } } },
      orderBy: { updatedAt: "desc" }, take: 200,
    }),
    prisma.acquisition.findMany({
      where: { status: { in: ["PAID", "ACCEPTED"] }, fulfillmentRuns: { none: {} } },
      include: { tenant: { select: { displayName: true } }, offering: { select: { name: true } } },
      orderBy: { updatedAt: "asc" }, take: 100,
    }),
  ]);
  return <div className="grid gap-5" dir="rtl"><header className="rounded-[1.6rem] border border-white/9 bg-white/[0.03] p-6"><p className="text-xs font-black text-[#f3cf73]">Fulfillment</p><h1 className="mt-2 text-2xl font-black text-white">تنفيذ الخدمات</h1><p className="mt-2 text-sm font-bold text-white/42">Automatic وManual وHybrid عبر Workflow handlers قابلة للإضافة.</p></header>{query.error ? <div className="rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}{ready.length ? <section className="grid gap-3"><h2 className="font-black text-white">جاهزة للبدء ({ready.length})</h2>{ready.map((acquisition) => <div key={acquisition.id} className="flex items-center gap-3 rounded-xl border border-amber-300/12 bg-amber-300/[0.035] p-4"><Play className="size-4 text-[#f3cf73]" /><span className="min-w-0 flex-1"><strong className="block text-sm text-white">{acquisition.offering.name}</strong><small className="text-white/35">{acquisition.tenant.displayName} · {acquisition.status}</small></span><form action={startAcquisitionFulfillmentAction}><input type="hidden" name="acquisitionId" value={acquisition.id} /><button className="rounded-lg bg-[#f3cf73] px-3 py-2 text-xs font-black text-[#17130a]">تشغيل</button></form></div>)}</section> : null}<section className="grid gap-3"><h2 className="font-black text-white">سجل التشغيل</h2>{runs.map((run) => <article key={run.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-blue-200">{run.status === "FAILED" ? <RotateCcw className="size-4" /> : <Activity className="size-4" />}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-white">{run.acquisition.offering.name}</strong><small className="text-white/35">{run.acquisition.tenant.displayName} · {run.workflowKey} v{run.workflowVersion}</small></span><span className="rounded-full bg-white/[0.055] px-2 py-1 text-[0.62rem] font-black text-white/55">{run.status}</span></div>{run.lastError ? <p className="mt-3 rounded-lg bg-red-500/8 p-3 text-xs font-bold text-red-100">{run.lastError}</p> : null}{run.status === "FAILED" ? <form action={retryFailedFulfillmentAction} className="mt-3"><input type="hidden" name="runId" value={run.id} /><button className="rounded-lg bg-blue-400/10 px-3 py-2 text-xs font-black text-blue-100">إعادة تشغيل الـWorkflow</button></form> : ["WAITING_CUSTOMER", "WAITING_INTERNAL", "READY"].includes(run.status) ? <form action={completeManualFulfillmentAction} className="mt-3 flex gap-2"><input type="hidden" name="runId" value={run.id} /><input name="note" placeholder="ملاحظة التسليم" className="min-h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/15 px-3 text-xs text-white" /><button className="rounded-lg bg-emerald-400/10 px-3 text-xs font-black text-emerald-100">تسليم وتفعيل</button></form> : null}</article>)}</section></div>;
}
