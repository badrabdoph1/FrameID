"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

type JsonRecord = Record<string, unknown>;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJsonObject(raw: string, fallback: JsonRecord): JsonRecord {
  if (!raw.trim()) return fallback;
  const parsed = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error("Template JSON must be an object");
  return parsed;
}

function readFeatureLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makePackageId(name: string, index: number) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 32);
  return base || `package-${index + 1}`;
}

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency === "EGP" ? "جنيه" : currency}`;
}

function readPackages(formData: FormData): JsonRecord[] {
  const count = readInt(formData, "packageCount");
  const packages: JsonRecord[] = [];

  for (let index = 0; index < count; index += 1) {
    if (!readBool(formData, `package_${index}_enabled`)) continue;

    const name = readString(formData, `package_${index}_name`);
    if (!name) continue;

    const currency = readString(formData, `package_${index}_currency`) || "EGP";
    const priceAmount = readInt(formData, `package_${index}_priceAmount`);
    const price = readString(formData, `package_${index}_price`) || formatMoney(priceAmount, currency);

    packages.push({
      id: readString(formData, `package_${index}_id`) || makePackageId(name, index),
      name,
      subtitle: readString(formData, `package_${index}_subtitle`),
      price,
      priceAmount,
      currency,
      features: readFeatureLines(readString(formData, `package_${index}_features`)),
      isHighlighted: readBool(formData, `package_${index}_isHighlighted`),
    });
  }

  const newName = readString(formData, "newPackageName");
  if (newName) {
    const currency = readString(formData, "newPackageCurrency") || "EGP";
    const priceAmount = readInt(formData, "newPackagePriceAmount");
    packages.push({
      id: makePackageId(newName, packages.length),
      name: newName,
      subtitle: readString(formData, "newPackageSubtitle"),
      price: readString(formData, "newPackagePrice") || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      features: readFeatureLines(readString(formData, "newPackageFeatures")),
      isHighlighted: readBool(formData, "newPackageIsHighlighted"),
    });
  }

  return packages;
}

function readExtras(formData: FormData): JsonRecord[] | null {
  const count = readInt(formData, "extraCount");
  if (count === 0 && !readString(formData, "newExtraName")) return null;

  const extras: JsonRecord[] = [];
  for (let index = 0; index < count; index += 1) {
    if (!readBool(formData, `extra_${index}_enabled`)) continue;
    const name = readString(formData, `extra_${index}_name`);
    if (!name) continue;
    const currency = readString(formData, `extra_${index}_currency`) || "EGP";
    const priceAmount = readInt(formData, `extra_${index}_priceAmount`);
    extras.push({
      id: readString(formData, `extra_${index}_id`) || makePackageId(name, index),
      name,
      price: readString(formData, `extra_${index}_price`) || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      iconKey: readString(formData, `extra_${index}_iconKey`) || "camera",
    });
  }

  const newName = readString(formData, "newExtraName");
  if (newName) {
    const currency = readString(formData, "newExtraCurrency") || "EGP";
    const priceAmount = readInt(formData, "newExtraPriceAmount");
    extras.push({
      id: makePackageId(newName, extras.length),
      name: newName,
      price: readString(formData, "newExtraPrice") || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      iconKey: readString(formData, "newExtraIconKey") || "camera",
    });
  }

  return extras;
}

async function auditTemplate(input: { adminId: string; adminEmail?: string; action: string; templateId: string; code: string; metadata?: JsonRecord }) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Template",
      entityId: input.templateId,
      actorUserId: input.adminId,
      metadata: {
        adminEmail: input.adminEmail,
        code: input.code,
        ...(input.metadata ?? {}),
      } as Prisma.InputJsonObject,
    },
  });
}

export async function saveTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  if (!id) redirect("/admin/templates?error=missing-template");

  const current = await prisma.template.findUnique({ where: { id } });
  if (!current) redirect("/admin/templates?error=template-not-found");

  try {
    const basePreview = readJsonObject(readString(formData, "previewDataJson"), isRecord(current.previewData) ? current.previewData : {});
    const baseSettings = readJsonObject(readString(formData, "settingsJson"), isRecord(current.settings) ? current.settings : {});
    const hero = isRecord(basePreview.hero) ? { ...basePreview.hero } : {};

    const previewTitle = readString(formData, "previewTitle");
    const previewDescription = readString(formData, "previewDescription");
    const previewImage = readString(formData, "previewImage");
    const heroHeadline = readString(formData, "heroHeadline");
    const heroSubheadline = readString(formData, "heroSubheadline");
    const heroImageUrl = readString(formData, "heroImageUrl");

    if (previewTitle) {
      basePreview.title = previewTitle;
      basePreview.headline = previewTitle;
    }
    if (previewDescription) basePreview.description = previewDescription;
    if (previewImage) basePreview.previewImage = previewImage;
    if (heroHeadline) hero.headline = heroHeadline;
    if (heroSubheadline) hero.subheadline = heroSubheadline;
    if (heroImageUrl) hero.imageUrl = heroImageUrl;
    basePreview.hero = hero;

    const packages = readPackages(formData);
    if (packages.length > 0) basePreview.packages = packages;

    const extras = readExtras(formData);
    if (extras) basePreview.extras = extras;

    const updated = await prisma.template.update({
      where: { id },
      data: {
        code: readString(formData, "code") || current.code,
        name: readString(formData, "name") || current.name,
        status: readString(formData, "status") || current.status,
        showroomOrder: readInt(formData, "showroomOrder", current.showroomOrder),
        previewData: basePreview as Prisma.InputJsonValue,
        settings: baseSettings as Prisma.InputJsonValue,
        deletedAt: null,
      } as never,
    });

    await auditTemplate({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "TEMPLATE_UPDATED",
      templateId: updated.id,
      code: updated.code,
      metadata: {
        status: updated.status,
        packagesCount: Array.isArray(basePreview.packages) ? basePreview.packages.length : 0,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveTemplate", id } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?saved=1");
}

export async function toggleTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const current = await prisma.template.findUnique({ where: { id } });
  if (!current) redirect("/admin/templates?error=template-not-found");

  const nextStatus = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const updated = await prisma.template.update({ where: { id }, data: { status: nextStatus } });
  await auditTemplate({
    adminId: admin.id,
    adminEmail: admin.email,
    action: nextStatus === "PUBLISHED" ? "TEMPLATE_PUBLISHED" : "TEMPLATE_UNPUBLISHED",
    templateId: updated.id,
    code: updated.code,
    metadata: { status: nextStatus },
  });

  revalidatePath("/admin/templates");
  redirect("/admin/templates?toggled=1");
}
