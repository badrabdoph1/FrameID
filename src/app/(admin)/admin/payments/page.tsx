import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    case "INSTAPAY":
      return "إنستا باي";
    case "VODAFONE_CASH":
      return "فودافون كاش";
    case "STRIPE":
      return "Stripe";
    case "PAYPAL":
      return "PayPal";
    default:
      return method;
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
    <CenterPageShell
      badge="مراجعة المدفوعات"
      title="المدفوعات"
      description="مراجعة وإدارة طلبات الدفع."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المدفوعات" }]}
    >
      {approved && (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          تم قبول الدفع وتفعيل الاشتراك.
        </p>
      )}
      {rejected && (
        <p className="rounded-[var(--radius-panel)] border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          تم رفض طلب الدفع.
        </p>
      )}
      {error && (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          تعذر تنفيذ العملية.
        </p>
      )}

      {payments.length > 0 && (
        <div className="rounded-[var(--radius-panel)] border border-warning/20 bg-warning/5 p-4">
          <h3 className="mb-3 text-sm font-medium text-warning">
            مدفوعات معلقة ({payments.length})
          </h3>
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-white">{p.customerName}</p>
                  <p className="text-white/60">
                    {p.amount} ج.م · {formatMethod(p.method)}
                  </p>
                  {p.reference && (
                    <p className="text-xs text-white/40">مرجع: {p.reference}</p>
                  )}
                  <p className="text-xs text-white/40">{p.createdAt}</p>
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
                    <Button type="submit" variant="luxury" size="sm">
                      قبول
                    </Button>
                  </form>
                  <form action={rejectPaymentAction} className="flex items-center gap-2">
                    <input type="hidden" name="paymentRequestId" value={p.id} />
                    <input
                      name="adminNote"
                      className="h-8 w-32 rounded-[var(--radius-control)] border border-white/10 bg-white/5 px-2 text-xs text-white outline-none"
                      placeholder="سبب الرفض"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      رفض
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-4 text-sm font-medium text-white/60">
          سجل المدفوعات
        </h3>
        <PaymentsTable data={data} />
      </div>
    </CenterPageShell>
  );
}
