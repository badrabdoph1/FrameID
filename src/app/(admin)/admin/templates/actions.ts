"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanTemplatePreview(value: unknown): Record<string, unknown> {
  const preview = isRecord(value) ? { ...value } : {};
  delete preview.packages;
  delete preview.extras;
  delete preview.gallery;
  delete preview.hero;
  delete preview.seo;
  delete preview.sharedDefaults;
  return preview;
}

function readStarterOverride(formData: FormData): Record<string, unknown> | null {
  const override = {
    photographerName: readString(formData, "starterOverridePhotographerName"),
    studioName: readString(formData, "starterOverrideStudioName"),
    description: readString(formData, "starterOverrideDescription"),
    heroImageUrl: readString(formData, "starterOverrideHeroImageUrl"),
  };
  const entries = Object.entries(override).filter(([, value]) => Boolean(value));
  return entries.length ? Object.fromEntries(entries) : null;
}

function makePackageId(name: string, index: number) {
  const base = name.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/giu, "-").replace(/^-+|-+$/gu, "").slice(0, 32);
  return base || `package-${index + 1}`;
}

function formatMoney(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency === "EGP" ? "جنيه" : currency}`;
}

function readPackages(formData: FormData): JsonRecord[] {
  const count = readInt(formData, "packageCount");
  const packages: JsonRecord[] = [];

  for (let index = 0; index < count; index += 1) {
    const name = readString(formData, `package_${index}_name`);
    if (!name) continue;
    const currency = readString(formData, `package_${index}_currency`) || "EGP";
    const priceAmount = readInt(formData, `package_${index}_priceAmount`);
    packages.push({
      id: readString(formData, `package_${index}_id`) || makePackageId(name, index),
      name,
      subtitle: readString(formData, `package_${index}_subtitle`),
      price: readString(formData, `package_${index}_price`) || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      imageUrl: readString(formData, `package_${index}_imageUrl`),
      features: readFeatureLines(readString(formData, `package_${index}_features`)),
      isHighlighted: readBool(formData, `package_${index}_isHighlighted`),
      enabled: readBool(formData, `package_${index}_enabled`),
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
      imageUrl: readString(formData, "newPackageImageUrl"),
      features: readFeatureLines(readString(formData, "newPackageFeatures")),
      isHighlighted: readBool(formData, "newPackageIsHighlighted"),
      enabled: true,
    });
  }

  return packages;
}

function readExtras(formData: FormData): JsonRecord[] | null {
  const count = readInt(formData, "extraCount");
  if (count === 0 && !readString(formData, "newExtraName")) return null;
  const extras: JsonRecord[] = [];

  for (let index = 0; index < count; index += 1) {
    const name = readString(formData, `extra_${index}_name`);
    if (!name) continue;
    const currency = readString(formData, `extra_${index}_currency`) || "EGP";
    const priceAmount = readInt(formData, `extra_${index}_priceAmount`);
    extras.push({
      id: readString(formData, `extra_${index}_id`) || makePackageId(name, index),
      name,
      description: readString(formData, `extra_${index}_description`),
      price: readString(formData, `extra_${index}_price`) || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      iconKey: readString(formData, `extra_${index}_iconKey`) || "camera",
      enabled: readBool(formData, `extra_${index}_enabled`),
    });
  }

  const newName = readString(formData, "newExtraName");
  if (newName) {
    const currency = readString(formData, "newExtraCurrency") || "EGP";
    const priceAmount = readInt(formData, "newExtraPriceAmount");
    extras.push({
      id: makePackageId(newName, extras.length),
      name: newName,
      description: readString(formData, "newExtraDescription"),
      price: readString(formData, "newExtraPrice") || formatMoney(priceAmount, currency),
      priceAmount,
      currency,
      iconKey: readString(formData, "newExtraIconKey") || "camera",
      enabled: true,
    });
  }

  return extras;
}

function readStarterOverride(formData: FormData): JsonRecord | null {
  const override = {
    photographerName: readString(formData, "starterOverridePhotographerName"),
    studioName: readString(formData, "starterOverrideStudioName"),
    description: readString(formData, "starterOverrideDescription"),
    heroImageUrl: readString(formData, "starterOverrideHeroImageUrl"),
  };
  const entries = Object.entries(override).filter(([, value]) => Boolean(value));
  return entries.length ? Object.fromEntries(entries) : null;
}

async function auditTemplate(input: { adminId: string; adminEmail?: string; action: string; templateId: string; code: string; metadata?: JsonRecord }) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "Template",
      entityId: input.templateId,
      metadata: { adminId: input.adminId, adminEmail: input.adminEmail, code: input.code, ...(input.metadata ?? {}) } as Prisma.InputJsonObject,
    },
  });
}

export async function saveTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  if (!id) redirect("/admin/templates?error=missing-template");

  const current = await prisma.template.findFirst({
    where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
  });
  if (!current) redirect("/admin/templates?error=template-not-found");

  try {
    const basePreview = readJsonObject(readString(formData, "previewDataJson"), isRecord(current.previewData) ? current.previewData : {});
    const baseSettings = readJsonObject(readString(formData, "settingsJson"), isRecord(current.settings) ? current.settings : {});

    const previewTitle = readString(formData, "previewTitle");
    const previewDescription = readString(formData, "previewDescription");
    const previewImage = readString(formData, "previewImage");
    const callToAction = readString(formData, "callToAction");
    const version = readString(formData, "version");
    const themeId = readString(formData, "themeId");

    if (previewTitle) {
      basePreview.title = previewTitle;
      basePreview.headline = previewTitle;
    }
    if (previewDescription) {
      basePreview.description = previewDescription;
      basePreview.subtitle = previewDescription;
    }
    if (previewImage) basePreview.previewImage = previewImage;
    if (callToAction) basePreview.callToAction = callToAction;

    const starterOverride = readStarterOverride(formData);
    if (starterOverride) basePreview.starterContentOverride = starterOverride;
    else delete basePreview.starterContentOverride;

    const starterOverride = readStarterOverride(formData);
    if (starterOverride) preview.starterContentOverride = starterOverride;
    else delete preview.starterContentOverride;

    if (version) settings.version = version;
    else delete settings.version;
    settings.contentSource = "starter-content-defaults";

    if (themeId) {
      const themeExists = await prisma.theme.count({ where: { id: themeId, deletedAt: null } });
      if (!themeExists) throw new Error("الثيم المحدد غير متاح.");
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        themeId: themeId || current.themeId,
        code: readString(formData, "code") || current.code,
        name: readString(formData, "name") || current.name,
        status: readString(formData, "status") || current.status,
        showroomOrder: readInt(formData, "showroomOrder", current.showroomOrder),
        previewData: preview as Prisma.InputJsonValue,
        settings: settings as Prisma.InputJsonValue,
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
        hasStarterOverride: Boolean(starterOverride),
        packagesCount: Array.isArray(basePreview.packages) ? basePreview.packages.length : 0,
        activePackagesCount: Array.isArray(basePreview.packages) ? basePreview.packages.filter((item) => isRecord(item) && item.enabled !== false).length : 0,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveTemplate", id } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?saved=1");
}

export async function toggleTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");
  const id = readString(formData, "id");
  const current = await prisma.template.findFirst({ where: { id, deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } } });
  if (!current) redirect("/admin/templates?error=template-not-found");
  const nextStatus = current.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const updated = await prisma.template.update({ where: { id }, data: { status: nextStatus } });
  await auditTemplate({ adminId: admin.id, adminEmail: admin.email, action: nextStatus === "PUBLISHED" ? "TEMPLATE_PUBLISHED" : "TEMPLATE_UNPUBLISHED", templateId: updated.id, code: updated.code, metadata: { status: nextStatus } });
  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  redirect("/admin/templates?toggled=1");
}
