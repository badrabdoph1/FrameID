"use server";

import { redirect } from "next/navigation";
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
    redirect("/admin/onboarding-cards?error=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "بيانات غير صالحة"));
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

  redirect("/admin/onboarding-cards?saved=1");
  return;
}

export async function resetCardOverride(formData: FormData) {
  await requireAdminPermission("onboarding-cards", "edit");

  const cardId = formData.get("cardId");
  if (typeof cardId !== "string" || !cardId) {
    redirect("/admin/onboarding-cards?error=" + encodeURIComponent("معرف الكارت مطلوب"));
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

  redirect("/admin/onboarding-cards?reset=1");
  return;
}
