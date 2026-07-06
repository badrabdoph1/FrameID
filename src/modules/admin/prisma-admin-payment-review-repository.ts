type PrismaAdminPaymentReviewClient = {
  paymentRequest: {
    findMany(input: unknown): Promise<unknown>;
  };
};

type RawPendingPayment = {
  id: string;
  method: string;
  amount: number;
  currency: string;
  reference: string | null;
  createdAt: Date;
  tenant: {
    displayName: string;
  };
  proofAsset: {
    url: string;
  } | null;
  subscriptionId: string;
};

export type PendingPaymentReviewItem = {
  id: string;
  customerName: string;
  method: string;
  amount: string;
  reference: string;
  proofUrl: string | null;
  createdAt: string;
};

export function createPrismaAdminPaymentReviewRepository(
  prisma: PrismaAdminPaymentReviewClient
) {
  return {
    async listPending(): Promise<PendingPaymentReviewItem[]> {
      const payments = (await prisma.paymentRequest.findMany({
        where: {
          status: "PENDING",
          deletedAt: null
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 50,
        select: {
          id: true,
          method: true,
          amount: true,
          currency: true,
          reference: true,
          createdAt: true,
          subscriptionId: true,
          proofAsset: {
            select: {
              url: true
            }
          },
          tenant: {
            select: {
              displayName: true
            }
          }
        }
      })) as RawPendingPayment[];

      return payments.map((payment) => ({
        id: payment.id,
        customerName: payment.tenant.displayName,
        method: payment.method,
        amount: `${formatNumber(payment.amount)} ${payment.currency}`,
        reference: payment.reference ?? "",
        proofUrl: payment.proofAsset?.url ?? null,
        createdAt: payment.createdAt.toISOString()
      }));
    }
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}
