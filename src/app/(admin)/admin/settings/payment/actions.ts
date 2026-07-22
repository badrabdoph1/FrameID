"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Legacy stubs — these actions are no longer available in the simplified payment settings.
// They exist only so orphaned components compile. They redirect to the main page.
export async function deletePaymentAccountAction() { redirect("/admin/settings/payment"); }
export async function movePaymentAccountAction() { redirect("/admin/settings/payment"); }
export async function addPaymentAccountAction() { redirect("/admin/settings/payment"); }
export async function uploadPaymentQRCodeAction() { redirect("/admin/settings/payment"); }

export async function updatePaymentAccountAction(formData: FormData) {
  const admin = await requireAdminPermission("payment-settings", "edit");

  const accountId = readString(formData, "accountId");
  const accountName = readString(formData, "accountName");
  const accountNumber = readString(formData, "accountNumber");

  if (!accountId || !accountName || !accountNumber) {
    redirect("/admin/settings/payment?error=الاسم والرقم مطلوبان");
  }

  try {
    const methodMap = {
      instapay: "INSTAPAY",
      "vodafone-cash": "VODAFONE_CASH",
    } as const;
    const method = methodMap[accountId];
    if (!method) throw new Error("حساب غير معروف");

    const settings = await prisma.paymentSettings.findUnique({
      where: { paymentMethod: method },
      select: {
        accounts: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    const paymentAccountId = settings?.accounts[0]?.id;
    if (!paymentAccountId) throw new Error("لم يتم العثور على الحساب");

    await prisma.paymentAccount.update({
      where: { id: paymentAccountId },
      data: {
        accountName,
        accountNumber,
        accountIdentifier: accountNumber,
        phoneNumber: accountNumber,
        displayName: accountName,
      },
    });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تحديث حسابات الدفع" });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "updatePaymentAccount", accountId } });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/settings/payment");
  revalidatePath("/admin/billing");
  redirect("/admin/settings/payment?success=1");
}
