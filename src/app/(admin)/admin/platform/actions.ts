"use server";

import { redirect } from "next/navigation";

import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { runVerification, simulateRecovery } from "@/modules/platform/platform-center-service";

export async function verifyPlatformAction() {
  const admin = await requireAdminPermission("backups", "view");
  try {
    const result = await runVerification();
    const params = new URLSearchParams({
      verified: "1",
      total: String(result.total),
      passed: String(result.passed),
      warnings: String(result.warnings),
      errors: String(result.errors),
    });
    redirect(`/admin/platform?${params.toString()}`);
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "verifyPlatform" } });
    redirect(`/admin/platform?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function simulateRecoveryAction() {
  const admin = await requireAdminPermission("backups", "view");
  try {
    const result = await simulateRecovery();
    const params = new URLSearchParams({
      simulate: "1",
      gitCount: String(result.gitRestorable.length),
      manualCount: String(result.needsSeparateRestore.length),
    });
    redirect(`/admin/platform?${params.toString()}`);
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "simulateRecovery" } });
    redirect(`/admin/platform?error=${encodeURIComponent(userError.message)}`);
  }
}
