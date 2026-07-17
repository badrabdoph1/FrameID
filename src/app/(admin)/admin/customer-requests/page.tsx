import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-workspace-primitives";
import { reviewCustomerRequestAction } from "./actions";

export const metadata: Metadata = {
  title: "طلبات العملاء | FrameID Admin"
};

export const dynamic = "force-dynamic";

type CustomerRequestPageProps = {
  searchParams: Promise<{
    status?: string;
    type?: string;
    updated?: string;
    error?: string;
  }>;
};

type CustomerRequestRow = {
  id: string;
  number: number;
  type: string;
  status: string;
  title: string;
  description: string | null;
  adminNote: string | null;
  tenantId: string;
  siteId: string;
  createdAt: Date;
  reviewedAt: Date | null;
  completedAt: Date | null;
  tenant: { displayName: string };
};

const typeLabels: Record<string, string> = {
  ACCOUNT_DELETION: "حذف حساب",
  FEATURE_ACTIVATION: "تفعيل ميزة",
  UPGRADE: "ترقية",
  ADDITIONAL_SERVICE: "خدمة إضافية",
  OTHER: "أخرى",
};

const statusLabels: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  PENDING: { label: "جديد", tone: "warning" },
  IN_REVIEW: { label: "قيد المراجعة", tone: "neutral" },
  APPROVED: { label: "موافق عليه", tone: "success" },
  REJECTED: { label: "مرفوض", tone: "danger" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELLED: { label: "ملغي", tone: "neutral" },
};

export default async function CustomerRequestsPage({ searchParams }: CustomerRequestPageProps) {
  await requireSuperAdminSession();
  const params = await searchParams;

  const statusFilter = params.status && params.status !== "all" ? params.status : undefined;
  const typeFilter = params.type && params.type !== "all" ? params.type : undefined;

  const validTypes = ["ACCOUNT_DELETION", "FEATURE_ACTIVATION", "UPGRADE", "ADDITIONAL_SERVICE", "OTHER"] as const;
  const validStatuses = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"] as const;

  const findManyArgs = {
    orderBy: { createdAt: "desc" as const },
    take: 100,
    include: {
      tenant: { select: { displayName: true } },
    },
  };

  type WhereClause = Record<string, unknown>;
  const where: WhereClause = {};
  if (statusFilter && validStatuses.includes(statusFilter as typeof validStatuses[number])) {
    where.status = statusFilter;
  }
  if (typeFilter && validTypes.includes(typeFilter as typeof validTypes[number])) {
    where.type = typeFilter;
  }

  const [rawRequests, stats] = await Promise.all([
    prisma.customerRequest.findMany({
      ...findManyArgs,
      where,
    }),
    prisma.customerRequest.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const requests = rawRequests as CustomerRequestRow[];
  const statsMap = stats.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = entry._count;
    return acc;
  }, {});

  const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0) as number;
  const pendingCount = (statsMap.PENDING ?? 0) as number;
  const inReviewCount = (statsMap.IN_REVIEW ?? 0) as number;

  return (
    <AdminPageShell
      badge="طلبات العملاء"
      title="طلبات العملاء"
      description="نظام مركزي لكل طلبات العملاء. قابل للتوسع لأنواع جديدة."
    >
      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={total} />
        <StatCard label="جديد" value={pendingCount} accent="warning" />
        <StatCard label="قيد المراجعة" value={inReviewCount} />
        <StatCard label="مكتمل" value={statsMap.COMPLETED ?? 0} accent="success" />
      </section>

      {params.updated ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200">
          تم تحديث الطلب بنجاح
        </section>
      ) : null}
      {params.error ? (
        <section className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">
          حدث خطأ في العملية
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/8 p-4">
          <FilterLink href="/admin/customer-requests" active={!statusFilter && !typeFilter}>الكل</FilterLink>
          <FilterLink href="/admin/customer-requests?status=PENDING" active={statusFilter === "PENDING"}>جديد</FilterLink>
          <FilterLink href="/admin/customer-requests?status=IN_REVIEW" active={statusFilter === "IN_REVIEW"}>قيد المراجعة</FilterLink>
          <FilterLink href="/admin/customer-requests?status=APPROVED" active={statusFilter === "APPROVED"}>موافق عليه</FilterLink>
          <FilterLink href="/admin/customer-requests?status=REJECTED" active={statusFilter === "REJECTED"}>مرفوض</FilterLink>
          <FilterLink href="/admin/customer-requests?status=COMPLETED" active={statusFilter === "COMPLETED"}>مكتمل</FilterLink>
          <span className="mx-2 h-5 w-px bg-white/10" />
          <FilterLink href="/admin/customer-requests?type=ACCOUNT_DELETION" active={typeFilter === "ACCOUNT_DELETION"}>حذف حساب</FilterLink>
          <FilterLink href="/admin/customer-requests?type=FEATURE_ACTIVATION" active={typeFilter === "FEATURE_ACTIVATION"}>تفعيل ميزة</FilterLink>
          <FilterLink href="/admin/customer-requests?type=UPGRADE" active={typeFilter === "UPGRADE"}>ترقية</FilterLink>
        </div>

        {requests.length === 0 ? (
          <div className="grid justify-items-center gap-3 p-12 text-center">
            <FileText className="size-10 text-white/25" />
            <h3 className="text-lg font-black text-[#fff7e8]">لا توجد طلبات</h3>
            <p className="text-sm font-bold text-white/45">ستظهر هنا الطلبات المقدمة من العملاء.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}

function RequestRow({ request }: { request: CustomerRequestRow }) {
  const status = statusLabels[request.status] ?? { label: request.status, tone: "neutral" as const };
  const typeLabel = typeLabels[request.type] ?? request.type;

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-white/35">#{request.number}</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[0.68rem] font-black text-white/55">{typeLabel}</span>
          <AdminStatusBadge label={status.label} tone={status.tone} />
        </div>
        <h3 className="text-sm font-black text-[#fff7e8]">{request.title}</h3>
        {request.description ? (
          <p className="text-xs font-bold leading-6 text-white/45">{request.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-white/40">
          <span>{request.tenant.displayName}</span>
          <span>·</span>
          <Link href={`/admin/customers/${request.tenantId}`} className="text-[#f3cf73] no-underline hover:underline">
            ملف العميل
          </Link>
          <span>·</span>
          <span>{new Date(request.createdAt).toLocaleDateString("ar-EG")}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RequestActionForm requestId={request.id} action="review" label="مراجعة" icon={Clock} tone="neutral" />
        <RequestActionForm requestId={request.id} action="approve" label="موافقة" icon={CheckCircle2} tone="success" />
        <RequestActionForm requestId={request.id} action="reject" label="رفض" icon={XCircle} tone="danger" />
        <RequestActionForm requestId={request.id} action="complete" label="اكتمال" icon={CheckCircle2} tone="success" />
      </div>
    </div>
  );
}

function RequestActionForm({ requestId, action, label, icon: Icon, tone }: {
  requestId: string;
  action: string;
  label: string;
  icon: typeof CheckCircle2;
  tone: "success" | "danger" | "neutral";
}) {
  const classes = tone === "success"
    ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
    : tone === "danger"
      ? "border-red-300/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
      : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]";

  return (
    <form action={reviewCustomerRequestAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`inline-flex min-h-8 items-center gap-1.5 rounded-xl border px-2.5 text-[0.68rem] font-black transition ${classes}`}>
        <Icon className="size-3.5" />
        {label}
      </button>
    </form>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: "warning" | "success" }) {
  const valueClass = accent === "warning" ? "text-amber-300" : accent === "success" ? "text-emerald-300" : "text-[#fff7e8]";
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-black text-white/40">{label}</p>
      <p className={`mt-1 text-xl font-black ${valueClass}`}>{value.toLocaleString("ar-EG")}</p>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-1.5 text-xs font-black no-underline transition ${active ? "bg-amber-300/15 text-[#f3cf73]" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"}`}
    >
      {children}
    </Link>
  );
}
