"use server";

import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { runVerification, simulateRecovery } from "@/modules/platform/platform-center-service";

export async function verifyPlatformAction() {
  await requireAdminPermission("backups", "view");
  const result = await runVerification();
  const params = new URLSearchParams({
    verified: "1",
    total: String(result.total),
    passed: String(result.passed),
    warnings: String(result.warnings),
    errors: String(result.errors),
  });
  redirect(`/admin/platform?${params.toString()}`);
}

export async function simulateRecoveryAction() {
  await requireAdminPermission("backups", "view");
  const result = await simulateRecovery();
  const params = new URLSearchParams({
    simulate: "1",
    gitCount: String(result.gitRestorable.length),
    manualCount: String(result.needsSeparateRestore.length),
  });
  redirect(`/admin/platform?${params.toString()}`);
}
