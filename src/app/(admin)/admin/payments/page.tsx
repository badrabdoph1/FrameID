import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { AdminPaymentsClient } from "./admin-payments-client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
    reupload?: string;
    "note-added"?: string;
  }>;
};

export type PaymentRequestFull = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  tenant: {
    id: string;
    displayName: string;
    createdAt: Date;
    owner: { name: string; email: string };
  };
  plan: { name: string; priceAmount: number } | null;
  subscription: { id: string };
  paymentAccount: {
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
  } | null;
  proofAsset: {
    url: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
  } | null;
  reviewedBy: { name: string } | null;
  logs: {
    id: string;
    action: string;
    actorName: string | null;
    note: string | null;
    createdAt: Date;
  }[];
};

export default async function AdminPaymentsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;

  const [allPayments, pendingCount, approvedThisMonth, monthlyRevenue] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        tenant: {
          select: {
            id: true,
            displayName: true,
            createdAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
        plan: { select: { name: true, priceAmount: true } },
        subscription: { select: { id: true } },
        paymentAccount: {
          select: {
            label: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
          },
        },
        proofAsset: {
          select: {
            url: true,
            mimeType: true,
            width: true,
            height: true,
            sizeBytes: true,
          },
        },
        reviewedBy: { select: { name: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            actorName: true,
            note: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.paymentRequest.count({
      where: {
        status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] },
        deletedAt: null,
      },
    }),
    prisma.paymentRequest.count({
      where: {
        status: "APPROVED",
        deletedAt: null,
        reviewedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.paymentRequest.aggregate({
      where: { status: "APPROVED", deletedAt: null },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = monthlyRevenue._sum.amount ?? 0;

  const reviewedPayments = allPayments.filter(
    (p) => p.reviewedAt && p.createdAt && (p.status === "APPROVED" || p.status === "REJECTED"),
  );
  let avgReviewHours: number | null = null;
  if (reviewedPayments.length > 0) {
    const totalDiff = reviewedPayments.reduce((sum, p) => {
      return sum + (p.reviewedAt!.getTime() - p.createdAt.getTime());
    }, 0);
    avgReviewHours = Math.round(totalDiff / reviewedPayments.length / (1000 * 60 * 60));
  }

  return (
    <AdminPaymentsClient
      payments={allPayments as unknown as PaymentRequestFull[]}
      stats={{
        pendingCount,
        approvedThisMonth,
        totalRevenue,
        avgReviewHours,
      }}
      banner={
        params.approved
          ? "approved"
          : params.rejected
            ? "rejected"
            : params.error
              ? "error"
              : params.reupload
                ? "reupload"
                : params["note-added"]
                  ? "note-added"
                  : null
      }
    />
  );
}
