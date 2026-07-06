import {
  approvePaymentAction,
  rejectPaymentAction
} from "@/app/(admin)/admin/payments/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminPaymentReviewRepository } from "@/modules/admin/prisma-admin-payment-review-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminPaymentsPageProps = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams
}: AdminPaymentsPageProps) {
  await requireSuperAdminSession();
  const { approved, rejected, error } = await searchParams;

  const repository = createPrismaAdminPaymentReviewRepository(prisma);
  const payments = await repository.listPending();

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">مراجعة المدفوعات</Badge>
        <h1 className="mt-4 text-3xl font-semibold">طلبات الدفع المعلقة</h1>
        <p className="mt-2 text-white/65">
          راجع المدفوعات اليدوية وفعّل المواقع بعد التأكد.
        </p>
      </section>

      {approved ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم قبول الدفع وتفعيل الاشتراك.
        </p>
      ) : null}

      {rejected ? (
        <p className="rounded-[var(--radius-panel)] border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
          تم رفض طلب الدفع وتسجيل المراجعة.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          تعذر تنفيذ العملية.
        </p>
      ) : null}

      <div className="grid gap-4">
        {payments.length ? (
          payments.map((payment) => (
            <Card key={payment.id} className="border-white/10 bg-white/10 text-white">
              <CardHeader>
                <CardTitle>{payment.customerName}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="grid gap-2 text-sm text-white/70">
                  <span>{formatPaymentMethod(payment.method)}</span>
                  <span>{payment.amount}</span>
                  <span>{payment.reference || "بدون مرجع"}</span>
                  <span>{payment.createdAt}</span>
                  {payment.proofUrl ? (
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-champagne underline-offset-4 hover:underline"
                    >
                      فتح إثبات الدفع
                    </a>
                  ) : (
                    <span>لا يوجد إثبات مرفوع</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <form action={approvePaymentAction}>
                    <input
                      type="hidden"
                      name="paymentRequestId"
                      value={payment.id}
                    />
                    <Button type="submit" variant="luxury">
                      قبول وتفعيل
                    </Button>
                  </form>
                  <form action={rejectPaymentAction} className="grid gap-2">
                    <input
                      type="hidden"
                      name="paymentRequestId"
                      value={payment.id}
                    />
                    <input
                      name="adminNote"
                      className="min-h-10 rounded-[var(--radius-control)] border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                      placeholder="سبب الرفض"
                    />
                    <Button type="submit" variant="secondary">
                      رفض الطلب
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-white/10 bg-white/10 text-white">
            <CardContent className="py-10 text-center text-white/60">
              لا توجد طلبات دفع معلقة.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case "INSTAPAY":
      return "إنستا باي";
    case "VODAFONE_CASH":
      return "فودافون كاش";
    default:
      return method;
  }
}
