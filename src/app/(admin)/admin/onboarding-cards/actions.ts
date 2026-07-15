"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

const saveSchema = z.object({
  cardId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
});

export async function saveCardOverride(formData: FormData) {
  await requireAdminPermission("onboarding-cards", "edit");

  const raw = {
    cardId: formData.get("cardId"),
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const { cardId, title, description } = parsed.data;
  const flagKey = `onboarding-card:${cardId}`;

  const existing = await prisma.featureFlag.findFirst({
    where: { key: flagKey, scope: "PLATFORM", tenantId: null, siteId: null },
  });

  if (existing) {
    await prisma.featureFlag.update({
      where: { id: existing.id },
      data: { value: { title, description }, enabled: true },
    });
  } else {
    await prisma.featureFlag.create({
      data: {
        key: flagKey,
        scope: "PLATFORM",
        value: { title, description },
        enabled: true,
      },
    });
  }

  revalidatePath("/admin/onboarding-cards");
  return { ok: true };
}

export async function resetCardOverride(formData: FormData) {
  await requireAdminPermission("onboarding-cards", "edit");

  const cardId = formData.get("cardId");
  if (typeof cardId !== "string" || !cardId) {
    return { ok: false, error: "معرف الكارت مطلوب" };
  }

  const flagKey = `onboarding-card:${cardId}`;

  await prisma.featureFlag.updateMany({
    where: {
      key: flagKey,
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
    },
    data: { enabled: false },
  });

  revalidatePath("/admin/onboarding-cards");
  return { ok: true };
}
