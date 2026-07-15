"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  getDeactivationPauseStats,
  getDeactivationPausedAccounts,
  isDeactivationPaused,
  runCatchUpDeactivation,
  setDeactivationPause,
} from "@/modules/lifecycle/customer-lifecycle";

export async function getDeactivationStatsAction() {
  await requireAdminPermission("deactivation-control", "view");
  return getDeactivationPauseStats(prisma);
}

export async function toggleDeactivationPauseAction(type: "trial" | "paid", paused: boolean) {
  const admin = await requireAdminPermission("deactivation-control", "edit");
  const label = type === "trial" ? "الحسابات التجريبية" : "الحسابات المدفوعة";

  try {
    await setDeactivationPause(prisma, type, paused, {
      pausedBy: admin.name,
      pausedByEmail: admin.email,
      pausedAt: new Date().toISOString(),
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: paused ? "DEACTIVATION_PAUSE_ENABLED" : "DEACTIVATION_PAUSE_DISABLED",
        entityType: "FeatureFlag",
        entityId: null,
        metadata: {
          type,
          label,
          adminEmail: admin.email,
          adminName: admin.name,
        },
      },
    });

    if (!paused) {
      const result = await runCatchUpDeactivation(prisma, type);
      revalidatePath("/admin/deactivation-control");
      revalidatePath("/admin/customers");
      return { success: true, paused: false, deactivatedCount: result.count };
    }

    revalidatePath("/admin/deactivation-control");
    return { success: true, paused: true, deactivatedCount: 0 };
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "toggleDeactivationPause", type, paused },
    });
    return { success: false, error: userError.message };
  }
}

export async function getPauseStatusAction() {
  await requireAdminPermission("deactivation-control", "view");
  const [trialPaused, paidPaused] = await Promise.all([
    isDeactivationPaused(prisma, "trial"),
    isDeactivationPaused(prisma, "paid"),
  ]);
  return { trialPaused, paidPaused };
}

export async function getPausedAccountsAction(
  type: "trial" | "paid",
  options: { search?: string; sortBy?: string; sortOrder?: "asc" | "desc"; page?: number; pageSize?: number; filter?: "all" | "expired-active" } = {},
) {
  await requireAdminPermission("deactivation-control", "view");
  return getDeactivationPausedAccounts(prisma, type, options);
}
