"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

function redirectPlanError(code: string): never {
  redirect(`/admin/plans?error=${encodeURIComponent(code)}`);
}

function slugifyPlanCode(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return slug || `plan-${Date.now().toString(36)}`;
}

function readAmount(formData: FormData): number {
  const amount = Number(readFormString(formData, "priceAmount"));
  if (!Number.isFinite(amount) || amount < 0) redirectPlanError("invalid-price");
  return Math.round(amount);
}

function readPlanFeatures(formData: FormData): Prisma.InputJsonObject {
  const legacyJson = readFormString(formData, "features").trim();
  if (legacyJson) {
    return JSON.parse(legacyJson) as Prisma.InputJsonObject;
  }

  const featureLines = formData
    .getAll("featureLines")
    .map((value) => String(value).trim())
    .filter(Boolean);

  return {
    description: readFormString(formData, "description").trim(),
    badgeLabel: readFormString(formData, "badgeLabel").trim(),
    isPopular: formData.get("isPopular") === "on" || formData.get("isPopular") === "true",
    storageLabel: readFormString(formData, "storageLabel").trim(),
    photoLimitLabel: readFormString(formData, "photoLimitLabel").trim(),
    ctaLabel: readFormString(formData, "ctaLabel").trim() || "اختيار الباقة",
    highlightText: readFormString(formData, "highlightText").trim(),
    featureLines,
  };
}

async function resolvePlanCode(input: { id?: string; name: string; requestedCode?: string }) {
  if (input.requestedCode?.trim()) return input.requestedCode.trim().toLowerCase();

  if (input.id) {
    const existing = await prisma.plan.findUnique({ where: { id: input.id }, select: { code: true } });
    if (existing?.code) return existing.code;
  }

  const baseCode = slugifyPlanCode(input.name);
  const existingCode = await prisma.plan.findUnique({ where: { code: baseCode }, select: { id: true } });
  if (!existingCode) return baseCode;

  return `${baseCode}-${Date.now().toString(36).slice(-4)}`;
}

async function auditPlan(input: { adminId: string; adminEmail?: string; action: string; planId?: string; code?: string; metadata?: Record<string, unknown> }) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Plan",
      entityId: input.planId,
      metadata: Object.fromEntries(
        Object.entries({ adminId: input.adminId, adminEmail: input.adminEmail, code: input.code, ...(input.metadata ?? {}) }).filter(([, value]) => value !== undefined),
      ) as Prisma.InputJsonObject,
    },
  });
}

export async function savePlanAction(formData: FormData) {
  const admin = await requireAdminPermission("plans", "edit");
  const id = readFormString(formData, "id");
  const name = readFormString(formData, "name").trim();
  const currency = readFormString(formData, "currency").trim().toUpperCase() || "EGP";
  const billingInterval = readFormString(formData, "billingInterval").trim() || "monthly";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const priceAmount = readAmount(formData);

  if (!name || name.length < 2) redirectPlanError("invalid-name");

  try {
    const code = await resolvePlanCode({ id, name, requestedCode: readFormString(formData, "code") });
    if (!code || code.length < 2) redirectPlanError("invalid-code");

    const features = readPlanFeatures(formData);
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
      metadata: {
        priceAmount,
        currency,
        billingInterval,
        isActive,
        isPopular: Boolean(features.isPopular),
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "savePlan", name } });
    redirect(`/admin/plans?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/plans");
  revalidatePath("/admin/billing");
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
  revalidatePath("/admin/billing");
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
  revalidatePath("/admin/billing");
  revalidatePath("/admin/search");
  redirect("/admin/plans?archived=1");
}
