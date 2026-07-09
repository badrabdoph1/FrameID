"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

function redirectPlanError(code: string): never {
  redirect(`/admin/plans?error=${encodeURIComponent(code)}`);
}

function parseFeatures(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed);
}

function readAmount(formData: FormData): number {
  const amount = Number(readFormString(formData, "priceAmount"));
  if (!Number.isFinite(amount) || amount < 0) redirectPlanError("invalid-price");
  return Math.round(amount);
}

async function auditPlan(input: { adminId: string; adminEmail?: string; action: string; planId?: string; code?: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Plan",
      entityId: input.planId,
      metadata: Object.fromEntries(Object.entries({ adminId: input.adminId, adminEmail: input.adminEmail, code: input.code, ...(input.metadata ?? {}) }).filter(([, value]) => value !== undefined)),
    },
  });
}

export async function savePlanAction(formData: FormData) {
  const admin = await requireAdminPermission("plans", "edit");
  const id = readFormString(formData, "id");
  const code = readFormString(formData, "code").trim().toLowerCase();
  const name = readFormString(formData, "name").trim();
  const currency = readFormString(formData, "currency").trim().toUpperCase() || "EGP";
  const billingInterval = readFormString(formData, "billingInterval").trim() || "monthly";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const priceAmount = readAmount(formData);

  if (!code || code.length < 2) redirectPlanError("invalid-code");
  if (!name || name.length < 2) redirectPlanError("invalid-name");

  try {
    const features = parseFeatures(readFormString(formData, "features"));
    const existing = id ? await prisma.plan.findUnique({ where: { id } }) : await prisma.plan.findUnique({ where: { code } });
    const saved = existing
      ? await prisma.plan.update({
          where: { id: existing.id },
          data: { code, name, priceAmount, currency, billingInterval, features, isActive, deletedAt: null } as never,
        })
      : await prisma.plan.create({
          data: { code, name, priceAmount, currency, billingInterval, features, isActive } as never,
        });

    await auditPlan({
      adminId: admin.id,
      adminEmail: admin.email,
      action: existing ? "PLAN_UPDATED" : "PLAN_CREATED",
      planId: saved.id,
      code: saved.code,
      metadata: { priceAmount, currency, billingInterval, isActive },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "savePlan", code } });
    redirect(`/admin/plans?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/admin/search");
  redirect("/admin/plans?saved=1");
}

export async function togglePlanAction(formData: FormData) {
  const admin = await requireAdminPermission("plans", "edit");
  const id = readFormString(formData, "id");
  const current = await prisma.plan.findUnique({ where: { id } });
  if (!current) redirectPlanError("plan-not-found");

  try {
    const updated = await prisma.plan.update({ where: { id }, data: { isActive: !current.isActive } });
    await auditPlan({
      adminId: admin.id,
      adminEmail: admin.email,
      action: updated.isActive ? "PLAN_ENABLED" : "PLAN_DISABLED",
      planId: updated.id,
      code: updated.code,
      metadata: { isActive: updated.isActive },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "togglePlan", id } });
    redirect(`/admin/plans?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/admin/search");
  redirect("/admin/plans?toggled=1");
}

export async function archivePlanAction(formData: FormData) {
  const admin = await requireAdminPermission("plans", "delete");
  const id = readFormString(formData, "id");
  const current = await prisma.plan.findUnique({ where: { id } });
  if (!current) redirectPlanError("plan-not-found");

  try {
    const archived = await prisma.plan.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
    await auditPlan({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "PLAN_ARCHIVED",
      planId: archived.id,
      code: archived.code,
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "archivePlan", id } });
    redirect(`/admin/plans?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/admin/search");
  redirect("/admin/plans?archived=1");
}
