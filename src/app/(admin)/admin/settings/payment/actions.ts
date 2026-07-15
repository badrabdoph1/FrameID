"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

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
  await requireAdminPermission("payment-settings", "edit");

  const accountId = readString(formData, "accountId");
  const accountName = readString(formData, "accountName");
  const accountNumber = readString(formData, "accountNumber");

  if (!accountId || !accountName || !accountNumber) {
    redirect("/admin/settings/payment?error=الاسم والرقم مطلوبان");
  }

  try {
    const { readFile, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const configPath = join(
      process.cwd(),
      "content/platform/admin-config.json",
    );
    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);

    const methodMap: Record<string, string> = {
      instapay: "INSTAPAY",
      "vodafone-cash": "VODAFONE_CASH",
    };
    const method = methodMap[accountId];
    if (!method) throw new Error("حساب غير معروف");

    const paymentSettings = config.paymentSettings;
    if (!Array.isArray(paymentSettings)) throw new Error("إعدادات الدفع غير موجودة");

    const setting = paymentSettings.find(
      (s: Record<string, unknown>) => s.paymentMethod === method,
    );
    if (!setting || !Array.isArray(setting.accounts)) {
      throw new Error("لم يتم العثور على الحساب");
    }

    setting.accounts[0] = {
      ...setting.accounts[0],
      accountName,
      accountNumber,
      accountIdentifier: accountNumber,
      phoneNumber: accountNumber,
      displayName: accountName,
    };

    await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("[payment] failed to save:", error);
    redirect("/admin/settings/payment?error=فشل حفظ التغيير");
  }

  revalidatePath("/admin/settings/payment");
  revalidatePath("/admin/billing");
  redirect("/admin/settings/payment?success=1");
}
