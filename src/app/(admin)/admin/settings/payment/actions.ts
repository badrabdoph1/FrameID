"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPaymentSettingsService } from "@/modules/billing/payment-settings-service";
import { createPrismaPaymentSettingsRepository } from "@/modules/billing/prisma-payment-settings-repository";

const service = createPaymentSettingsService(
  createPrismaPaymentSettingsRepository(prisma),
);

export async function updatePaymentSettingsAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const id = formData.get("settingsId");
  const label = formData.get("label");
  const description = formData.get("description");
  const sortOrder = formData.get("sortOrder");

  if (typeof id !== "string" || !id) {
    redirect("/admin/settings/payment?error=معرف الإعدادات مطلوب");
  }

  try {
    const data: Record<string, unknown> = {};
    if (typeof label === "string") data.label = label;
    if (typeof description === "string") data.description = description;
    if (typeof sortOrder === "string") data.sortOrder = parseInt(sortOrder, 10) || 0;
    await service.updatePaymentSettings(id, data);
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "updatePaymentSettings", settingsId: id },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=updated");
}

export async function togglePaymentMethodAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const id = formData.get("settingsId");
  const isActive = formData.get("isActive");

  if (typeof id !== "string" || !id) {
    redirect("/admin/settings/payment?error=معرف الإعدادات مطلوب");
  }

  try {
    await service.togglePaymentMethod(id, isActive === "1");
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "togglePaymentMethod", settingsId: id },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=toggled");
}

export async function addPaymentAccountAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const settingsId = formData.get("settingsId");
  const label = formData.get("label");
  const accountName = formData.get("accountName");
  const accountNumber = formData.get("accountNumber");
  const bankName = formData.get("bankName");
  const iban = formData.get("iban");
  const swift = formData.get("swift");
  const phoneNumber = formData.get("phoneNumber");
  const instructions = formData.get("instructions");
  const notes = formData.get("notes");

  if (typeof settingsId !== "string" || !settingsId) {
    redirect("/admin/settings/payment?error=معرف الإعدادات مطلوب");
  }

  try {
    await service.addPaymentAccount(settingsId, {
      label: typeof label === "string" ? label : "",
      accountName: typeof accountName === "string" ? accountName : "",
      accountNumber: typeof accountNumber === "string" ? accountNumber : "",
      bankName: typeof bankName === "string" ? bankName : "",
      iban: typeof iban === "string" ? iban : "",
      swift: typeof swift === "string" ? swift : "",
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber : "",
      instructions: typeof instructions === "string" ? instructions : "",
      notes: typeof notes === "string" ? notes : "",
      sortOrder: 0,
    });
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "addPaymentAccount", settingsId },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=account-added");
}

export async function updatePaymentAccountAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const id = formData.get("accountId");
  const label = formData.get("label");
  const accountName = formData.get("accountName");
  const accountNumber = formData.get("accountNumber");
  const bankName = formData.get("bankName");
  const iban = formData.get("iban");
  const swift = formData.get("swift");
  const phoneNumber = formData.get("phoneNumber");
  const instructions = formData.get("instructions");
  const notes = formData.get("notes");

  if (typeof id !== "string" || !id) {
    redirect("/admin/settings/payment?error=معرف الحساب مطلوب");
  }

  try {
    const data: Record<string, unknown> = {};
    if (typeof label === "string") data.label = label;
    if (typeof accountName === "string") data.accountName = accountName;
    if (typeof accountNumber === "string") data.accountNumber = accountNumber;
    if (typeof bankName === "string") data.bankName = bankName;
    if (typeof iban === "string") data.iban = iban;
    if (typeof swift === "string") data.swift = swift;
    if (typeof phoneNumber === "string") data.phoneNumber = phoneNumber;
    if (typeof instructions === "string") data.instructions = instructions;
    if (typeof notes === "string") data.notes = notes;
    await service.updatePaymentAccount(id, data);
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "updatePaymentAccount", accountId: id },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=account-updated");
}

export async function deletePaymentAccountAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const id = formData.get("accountId");

  if (typeof id !== "string" || !id) {
    redirect("/admin/settings/payment?error=معرف الحساب مطلوب");
  }

  try {
    await service.deletePaymentAccount(id);
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "deletePaymentAccount", accountId: id },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=account-deleted");
}

export async function movePaymentAccountAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const id = formData.get("accountId");
  const direction = formData.get("direction");

  if (typeof id !== "string" || !id) {
    redirect("/admin/settings/payment?error=معرف الحساب مطلوب");
  }

  if (direction !== "up" && direction !== "down") {
    redirect("/admin/settings/payment?error=اتجاه غير صالح");
  }

  try {
    const current = await prisma.paymentAccount.findUnique({
      where: { id },
      select: { id: true, sortOrder: true, paymentSettingsId: true },
    });

    if (!current) {
      redirect("/admin/settings/payment?error=الحساب غير موجود");
    }

    const adjacent = await prisma.paymentAccount.findFirst({
      where: {
        paymentSettingsId: current.paymentSettingsId,
        isActive: true,
        sortOrder: direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
      select: { id: true, sortOrder: true },
    });

    if (adjacent) {
      await prisma.paymentAccount.update({
        where: { id: current.id },
        data: { sortOrder: adjacent.sortOrder },
      });
      await prisma.paymentAccount.update({
        where: { id: adjacent.id },
        data: { sortOrder: current.sortOrder },
      });
    }
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "movePaymentAccount", accountId: id },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=updated");
}

export async function uploadPaymentQRCodeAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const settingsId = formData.get("settingsId");
  const assetId = formData.get("assetId");

  if (typeof settingsId !== "string" || !settingsId) {
    redirect("/admin/settings/payment?error=معرف الإعدادات مطلوب");
  }

  try {
    await service.updateQRCode(
      settingsId,
      typeof assetId === "string" && assetId ? assetId : null,
    );
  } catch (error) {
    await processError(error, {
      userId: session.user.id,
      metadata: { action: "uploadPaymentQRCode", settingsId },
    });
    redirect(`/admin/settings/payment?error=${encodeURIComponent(
      error instanceof Error ? error.message : "حدث خطأ",
    )}`);
  }

  revalidatePath("/admin/settings/payment");
  redirect("/admin/settings/payment?success=qr-updated");
}
