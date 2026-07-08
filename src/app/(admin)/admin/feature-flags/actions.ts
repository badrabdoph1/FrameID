"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

type FlagScope = "PLATFORM" | "TENANT" | "SITE";

function readScope(formData: FormData): FlagScope {
  const scope = readFormString(formData, "scope").toUpperCase();
  if (scope === "TENANT" || scope === "SITE") return scope;
  return "PLATFORM";
}

function readFlagValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
}

async function auditFeatureFlagChange(input: {
  adminId: string;
  adminEmail?: string;
  action: string;
  flagId?: string;
  key?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: "FeatureFlag",
      entityId: input.flagId,
      metadata: {
        adminId: input.adminId,
        adminEmail: input.adminEmail,
        key: input.key,
        ...(input.metadata ?? {}),
      },
    },
  });
}

export async function saveFeatureFlagAction(formData: FormData) {
  const admin = await requireAdminPermission("feature-flags", "edit");
  const id = readFormString(formData, "id");
  const key = readFormString(formData, "key").trim();
  const scope = readScope(formData);
  const enabled = formData.get("enabled") === "on" || formData.get("enabled") === "true";
  const rawValue = readFormString(formData, "value");
  const tenantId = scope === "TENANT" ? readFormString(formData, "tenantId") || null : null;
  const siteId = scope === "SITE" ? readFormString(formData, "siteId") || null : null;

  try {
    if (!key || key.length < 3) {
      redirect("/admin/feature-flags?error=invalid-key");
    }

    if (scope === "TENANT" && !tenantId) {
      redirect("/admin/feature-flags?error=missing-tenant");
    }

    if (scope === "SITE" && !siteId) {
      redirect("/admin/feature-flags?error=missing-site");
    }

    const value = readFlagValue(rawValue);

    const existing = id
      ? await prisma.featureFlag.findUnique({ where: { id } })
      : await prisma.featureFlag.findFirst({
          where: {
            key,
            scope,
            tenantId,
            siteId,
          },
        });

    const saved = existing
      ? await prisma.featureFlag.update({
          where: { id: existing.id },
          data: { key, scope, tenantId, siteId, enabled, value },
        })
      : await prisma.featureFlag.create({
          data: { key, scope, tenantId, siteId, enabled, value },
        });

    await auditFeatureFlagChange({
      adminId: admin.id,
      adminEmail: admin.email,
      action: existing ? "FEATURE_FLAG_UPDATED" : "FEATURE_FLAG_CREATED",
      flagId: saved.id,
      key: saved.key,
      metadata: { scope, enabled, tenantId, siteId },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "saveFeatureFlag", key, scope },
    });
    redirect(`/admin/feature-flags?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/feature-flags");
  revalidatePath("/admin/search");
  redirect("/admin/feature-flags?saved=1");
}

export async function toggleFeatureFlagAction(formData: FormData) {
  const admin = await requireAdminPermission("feature-flags", "edit");
  const id = readFormString(formData, "id");

  try {
    const current = await prisma.featureFlag.findUnique({ where: { id } });
    if (!current) redirect("/admin/feature-flags?error=flag-not-found");

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: { enabled: !current.enabled },
    });

    await auditFeatureFlagChange({
      adminId: admin.id,
      adminEmail: admin.email,
      action: updated.enabled ? "FEATURE_FLAG_ENABLED" : "FEATURE_FLAG_DISABLED",
      flagId: updated.id,
      key: updated.key,
      metadata: { scope: updated.scope, enabled: updated.enabled },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "toggleFeatureFlag", id },
    });
    redirect(`/admin/feature-flags?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/feature-flags");
  revalidatePath("/admin/search");
  redirect("/admin/feature-flags?toggled=1");
}

export async function deleteFeatureFlagAction(formData: FormData) {
  const admin = await requireAdminPermission("feature-flags", "delete");
  const id = readFormString(formData, "id");

  try {
    const current = await prisma.featureFlag.findUnique({ where: { id } });
    if (!current) redirect("/admin/feature-flags?error=flag-not-found");

    await prisma.featureFlag.delete({ where: { id } });
    await auditFeatureFlagChange({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "FEATURE_FLAG_DELETED",
      flagId: current.id,
      key: current.key,
      metadata: { scope: current.scope, tenantId: current.tenantId, siteId: current.siteId },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "deleteFeatureFlag", id },
    });
    redirect(`/admin/feature-flags?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/feature-flags");
  revalidatePath("/admin/search");
  redirect("/admin/feature-flags?deleted=1");
}
