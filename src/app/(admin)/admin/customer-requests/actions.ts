"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { processError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export async function reviewCustomerRequestAction(formData: FormData) {
  const session = await requireSuperAdminSession();

  const requestId = readString(formData, "requestId");
  const action = readString(formData, "action");
  const adminNote = readString(formData, "adminNote");

  if (!requestId || !action) {
    redirect("/admin/customer-requests?error=invalid");
  }

  const validStatuses: Record<string, "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"> = {
    review: "IN_REVIEW",
    approve: "APPROVED",
    reject: "REJECTED",
    complete: "COMPLETED",
    cancel: "CANCELLED",
  };

  const newStatus = validStatuses[action];
  if (!newStatus) {
    redirect("/admin/customer-requests?error=invalid-action");
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    reviewedBy: session.user.id,
    reviewedAt: new Date(),
  };

  if (adminNote) {
    updateData.adminNote = adminNote;
  }

  if (newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  try {
    const request = await prisma.customerRequest.findUnique({
      where: { id: requestId },
      select: { tenantId: true, siteId: true, type: true },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    await prisma.customerRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    if (request.type === "ACCOUNT_DELETION") {
      if (newStatus === "APPROVED") {
        const now = new Date();
        await prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.findUnique({
            where: { id: request.tenantId },
            select: {
              sites: { select: { id: true } },
              owner: { select: { id: true } },
            },
          });

          if (tenant) {
            await tx.domain.deleteMany({
              where: { siteId: { in: tenant.sites.map((s) => s.id) } },
            });

            await tx.site.updateMany({
              where: { tenantId: request.tenantId },
              data: { deletedAt: now },
            });

            await tx.subscription.deleteMany({
              where: { tenantId: request.tenantId },
            });

            await tx.paymentRequest.updateMany({
              where: { tenantId: request.tenantId },
              data: { deletedAt: now },
            });

            await tx.tenant.update({
              where: { id: request.tenantId },
              data: { deletedAt: now, status: "EXPIRED" },
            });

            if (tenant.owner) {
              await tx.user.update({
                where: { id: tenant.owner.id },
                data: { deletedAt: now },
              });
            }
          }

          await tx.auditLog.create({
            data: {
              actorId: session.user.id,
              tenantId: request.tenantId,
              action: "CUSTOMER_DELETED",
              entityType: "CustomerRequest",
              entityId: requestId,
              metadata: { reason: "ACCOUNT_DELETION_APPROVED" },
            },
          });

          await tx.notification.create({
            data: {
              tenantId: request.tenantId,
              type: "account_deletion",
              title: "تم حذف الحساب",
              body: "تم حذف حسابك وموقعك بناءً على طلبك. للاستفسار، تواصل مع الدعم.",
            },
          });
        });
      } else if (newStatus === "REJECTED") {
        await prisma.notification.create({
          data: {
            tenantId: request.tenantId,
            type: "account_deletion_rejected",
            title: "تم رفض طلب حذف الحساب",
            body: adminNote || "لم يتم الموافقة على طلب حذف الحساب. للاستفسار، تواصل مع الدعم.",
          },
        });
      }
    }
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "reviewCustomerRequest", requestId } });
    redirect(`/admin/customer-requests?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/customer-requests");
  redirect("/admin/customer-requests?updated=1");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
