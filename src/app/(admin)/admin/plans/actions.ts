"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

const MAX_INT32 = 2_147_483_647;

function redirectPlanError(code: string): never {
  redirect(`/admin/plans?error=${encodeURIComponent(code)}`);
}

function safeRedirect(url: string) {
  try { redirect(url); } catch { /* next.js redirect thrown */ }
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

function parseAmount(formData: FormData): number | string {
  const raw = readFormString(formData, "priceAmount").replace(/,/g, "");
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return "invalid-price";
  const rounded = Math.round(amount);
  if (rounded > MAX_INT32) return "price-too-large";
  return rounded;
}

function parseSortOrder(formData: FormData): number {
  const raw = Number.parseInt(readFormString(formData, "sortOrder"), 10);
  return Math.max(0, Number.isFinite(raw) ? raw : 0);
}

function readPlanFeatures(formData: FormData): Prisma.InputJsonObject {
  const featureLines = formData
    .getAll("featureLines")
    .map((value) => String(value).trim())
    .filter(Boolean);

  return {
    description: readFormString(formData, "description").trim().slice(0, 2000),
    badgeLabel: readFormString(formData, "badgeLabel").trim().slice(0, 100),
    isPopular: formData.get("isPopular") === "on",
    isComingSoon: formData.get("isComingSoon") === "on",
    storageLabel: readFormString(formData, "storageLabel").trim().slice(0, 100),
    photoLimitLabel: readFormString(formData, "photoLimitLabel").trim().slice(0, 100),
    ctaLabel: readFormString(formData, "ctaLabel").trim().slice(0, 100) || "اختيار الباقة",
    highlightText: readFormString(formData, "highlightText").trim().slice(0, 200),
    featureLines: featureLines.map((line) => line.slice(0, 200)),
  };
}

async function resolvePlanCode(input: { id?: string; name: string; requestedCode?: string }): Promise<string> {
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

async function safeAudit(input: { adminId: string; adminEmail?: string; action: string; planId?: string; code?: string; metadata?: Record<string, unknown> }) {
  try {
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
  } catch (err) {
    console.warn("[admin-plans] Audit log failed:", err);
  }
}

async function safeSync(input: { actor: { id: string; name?: string | null; email?: string | null }; reason: string }) {
  try {
    await syncPlatformConfigurationToGitHub(input);
  } catch (err) {
    console.warn("[admin-plans] Platform sync failed:", err);
  }
}

function revalidatePlanPaths() {
  revalidatePath("/admin/plans");
  revalidatePath("/admin/billing");
  revalidatePath("/admin/search");
  revalidatePath("/", "layout");
}

export async function savePlanAction(formData: FormData) {
  let admin;
  try {
    admin = await requireAdminPermission("plans", "edit");
  } catch {
    redirectPlanError("unauthorized");
  }

  const id = readFormString(formData, "id");
  const name = readFormString(formData, "name").trim();
  const currency = readFormString(formData, "currency").trim().toUpperCase() || "EGP";
  const billingInterval = readFormString(formData, "billingInterval").trim() || "monthly";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const priceResult = parseAmount(formData);
  const sortOrder = parseSortOrder(formData);

  if (typeof priceResult === "string") redirectPlanError(priceResult);
  const priceAmount = priceResult;

  if (!name || name.length < 2) redirectPlanError("invalid-name");
  if (name.length > 200) redirectPlanError("name-too-long");

  try {
    const code = await resolvePlanCode({ id, name, requestedCode: readFormString(formData, "code") });
    if (!code || code.length < 2) redirectPlanError("invalid-code");

    const features = readPlanFeatures(formData);
    const featuresJson = features as Prisma.InputJsonValue;

    const existing = id ? await prisma.plan.findUnique({ where: { id }, select: { id: true, code: true } }) : null;

    const saved = existing
      ? await prisma.plan.update({
          where: { id: existing.id },
          data: { code, name, priceAmount, currency, billingInterval, features: featuresJson, isActive, sortOrder },
        })
      : await prisma.plan.create({
          data: { code, name, priceAmount, currency, billingInterval, features: featuresJson, isActive, sortOrder },
        });

    safeAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: existing ? "PLAN_UPDATED" : "PLAN_CREATED",
      planId: saved.id,
      code: saved.code,
      metadata: { priceAmount, currency, billingInterval, isActive, sortOrder },
    });

    safeSync({ actor: admin, reason: existing ? "تعديل باقة" : "إنشاء باقة" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    const message = extractSafeMessage(error);
    redirectPlanError(message);
  }

  revalidatePlanPaths();
  redirect("/admin/plans?saved=1");
}

export async function togglePlanAction(formData: FormData) {
  let admin;
  try {
    admin = await requireAdminPermission("plans", "edit");
  } catch {
    redirectPlanError("unauthorized");
  }

  const id = readFormString(formData, "id");
  if (!id) redirectPlanError("missing-id");

  try {
    const current = await prisma.plan.findUnique({ where: { id } });
    if (!current) redirectPlanError("plan-not-found");

    const updated = await prisma.plan.update({ where: { id }, data: { isActive: !current.isActive } });

    safeAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: updated.isActive ? "PLAN_ENABLED" : "PLAN_DISABLED",
      planId: updated.id,
      code: updated.code,
      metadata: { isActive: updated.isActive },
    });

    safeSync({ actor: admin, reason: updated.isActive ? "تفعيل باقة" : "تعطيل باقة" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    const message = extractSafeMessage(error);
    redirectPlanError(message);
  }

  revalidatePlanPaths();
  redirect("/admin/plans?toggled=1");
}

export async function archivePlanAction(formData: FormData) {
  let admin;
  try {
    admin = await requireAdminPermission("plans", "delete");
  } catch {
    redirectPlanError("unauthorized");
  }

  const id = readFormString(formData, "id");
  if (!id) redirectPlanError("missing-id");

  try {
    const current = await prisma.plan.findUnique({ where: { id } });
    if (!current) redirectPlanError("plan-not-found");

    const archived = await prisma.plan.update({ where: { id }, data: { isActive: false } });

    safeAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "PLAN_ARCHIVED",
      planId: archived.id,
      code: archived.code,
    });

    safeSync({ actor: admin, reason: "أرشفة باقة" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    const message = extractSafeMessage(error);
    redirectPlanError(message);
  }

  revalidatePlanPaths();
  redirect("/admin/plans?archived=1");
}

export async function reorderPlanAction(formData: FormData) {
  let admin;
  try {
    admin = await requireAdminPermission("plans", "edit");
  } catch {
    redirectPlanError("unauthorized");
  }

  const id = readFormString(formData, "id");
  const direction = readFormString(formData, "direction");

  if (!id) redirectPlanError("missing-id");
  if (direction !== "up" && direction !== "down") redirectPlanError("invalid-direction");

  try {
    const current = await prisma.plan.findUnique({ where: { id } });
    if (!current) redirectPlanError("plan-not-found");

    const neighbor = await prisma.plan.findFirst({
      where: {
        id: { not: id },
        isActive: current.isActive,
        sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
      },
      orderBy: direction === "up" ? { sortOrder: "desc" } : { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    if (!neighbor) redirectPlanError("already-at-edge");

    await prisma.$transaction([
      prisma.plan.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
      prisma.plan.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
    ]);

    safeAudit({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "PLAN_REORDERED",
      planId: current.id,
      code: current.code,
      metadata: { from: current.sortOrder, to: neighbor.sortOrder, direction },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
    const message = extractSafeMessage(error);
    redirectPlanError(message);
  }

  revalidatePlanPaths();
  redirect("/admin/plans?reordered=1");
}

function extractSafeMessage(error: unknown): string {
  if (!(error instanceof Error)) return "حدث خطأ غير متوقع";
  const msg = error.message;
  if (msg.includes("P2002")) return "هذه الباقة موجودة قبل كده";
  if (msg.includes("P2025")) return "الباقة اللي بتدور عليها مش موجودة";
  if (msg.includes("P2003")) return "بيانات الباقة فيها مشكلة في العلاقات";
  if (msg.includes("P1001") || msg.includes("DATABASE_URL")) return "قاعدة البيانات مش متصلة";
  if (msg.includes("Invalid `prisma")) return "بيانات غير صالحة، تأكد من كل الخانات";
  if (msg.includes("too long") || msg.includes("too_many")) return "البيانات أطول من المسموح";
  return "حدث خطأ أثناء الحفظ، حاول مرة أخرى";
}
