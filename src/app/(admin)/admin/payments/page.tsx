import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  approvePaymentAction,
  rejectPaymentAction,
} from "@/app/(admin)/admin/payments/actions";
import { createPrismaAdminPaymentReviewRepository } from "@/modules/admin/prisma-admin-payment-review-repository";
import { PaymentsTable, type PaymentRow } from "@/app/(admin)/admin/payments/payments-table";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ approved?: string; rejected?: string; error?: string }>;
};

function formatMethod(method: string): string {
  switch (method) {
    case "INSTAPAY": return "إنستا باي";
    case "VODAFONE_CASH": return "فودافون كاش";
    case "STRIPE": return "Stripe";
    case "PAYPAL": return "PayPal";
    default: return method;
  }
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const { approved, rejected, error } = await searchParams;
  const repository = createPrismaAdminPaymentReviewRepository(prisma);
  const payments = await repository.listPending();

  const allPayments = await prisma.paymentRequest.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      reference: true,
      createdAt: true,
      reviewedAt: true,
      tenant: { select: { displayName: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  const data: PaymentRow[] = allPayments.map((p) => ({
    id: p.id,
    tenantName: p.tenant.displayName,
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference,
    createdAt: p.createdAt.toISOString(),
    reviewedAt: p.reviewedAt?.toISOString() ?? null,
    reviewerName: p.reviewedBy?.name ?? null,
  }));

  return (
    <AdminPageShell
      badge="الإدارة"
      title="المدفوعات"
      description="مراجعة وإدارة طلبات الدفع"
    >
      {approved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          تم قبول الدفع وتفعيل الاشتراك
        </div>
      )}
      {rejected && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          تم رفض طلب الدفع
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          تعذر تنفيذ العملية
        </div>
      )}

      {payments.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
          <h3 className="mb-3 text-sm font-medium text-amber-400">
            مدفوعات معلقة ({payments.length})
          </h3>
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-white/80">{p.customerName}</p>
                  <p className="text-white/50">{p.amount} ج.م · {formatMethod(p.method)}</p>
                  {p.reference && <p className="text-xs text-white/35">مرجع: {p.reference}</p>}
                  <p className="text-xs text-white/35">{p.createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.proofUrl && (
                    <a
                      href={p.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-champagne underline-offset-4 hover:underline"
                    >
                      فتح الإثبات
                    </a>
                  )}
                  <form action={approvePaymentAction}>
                    <input type="hidden" name="paymentRequestId" value={p.id} />
                    <button type="submit" className="rounded-lg bg-champagne px-4 py-2 text-xs font-medium text-ink transition hover:bg-champagne/90">
                      قبول
                    </button>
                  </form>
                  <form action={rejectPaymentAction} className="flex items-center gap-2">
                    <input type="hidden" name="paymentRequestId" value={p.id} />
                    <input
                      name="adminNote"
                      className="h-8 w-28 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 text-xs text-white outline-none placeholder:text-white/20"
                      placeholder="سبب الرفض"
                    />
                    <button type="submit" className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white">
                      رفض
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-4 text-sm font-medium text-white/60">سجل المدفوعات</h3>
        <PaymentsTable data={data} />
      </div>
    </AdminPageShell>
  );
}
