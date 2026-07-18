"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { buildCommunicationAudienceWhere, type CommunicationAudienceSelection } from "@/modules/communication-center/audience-resolver";
import { parseLocalBroadcastSchedule } from "@/modules/communication-center/broadcast-schedule";
import { communicationCore } from "@/modules/communication-center/runtime";

const modes = new Set(["ALL", "TRIAL", "SUBSCRIBED", "EXPIRED", "EXPLICIT"]);
const announcementTypes = new Set(["announcement.update", "announcement.maintenance", "announcement.feature", "announcement.notice", "announcement.alert"]);

function value(formData: FormData, key: string, required = true): string {
  const raw = formData.get(key);
  const normalized = typeof raw === "string" ? raw.trim() : "";
  if (required && !normalized) throw new Error(`${key} مطلوب.`);
  return normalized;
}

export async function publishCommunicationBroadcastAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  let recipientCount = 0;
  try {
    const mode = value(formData, "audienceMode");
    if (!modes.has(mode)) throw new Error("الجمهور غير صالح.");
    const explicitIds = value(formData, "tenantIds", false).split(/[\s,]+/).map((id) => id.trim()).filter(Boolean);
    const selection = mode === "EXPLICIT"
      ? { mode: "EXPLICIT", tenantIds: explicitIds } as const
      : { mode } as Exclude<CommunicationAudienceSelection, { mode: "EXPLICIT" }>;
    const where = buildCommunicationAudienceWhere(selection);
    const tenants = await prisma.tenant.findMany({ where, orderBy: { id: "asc" }, select: { id: true } });
    if (tenants.length === 0) throw new Error("لا يوجد عملاء مطابقون للجمهور المحدد.");
    if (mode === "EXPLICIT" && new Set(tenants.map((tenant) => tenant.id)).size !== new Set(explicitIds).size) {
      throw new Error("بعض معرفات العملاء غير موجودة أو محذوفة.");
    }
    const typeKey = value(formData, "typeKey").toLowerCase();
    if (!announcementTypes.has(typeKey)) throw new Error("نوع الإعلان غير صالح.");
    const scheduledRaw = value(formData, "scheduledAt", false);
    const scheduledAt = parseLocalBroadcastSchedule(scheduledRaw, value(formData, "timezoneOffsetMinutes", false));

    const result = await communicationCore.publishCampaign({
      sourceModule: "communication-center",
      idempotencyKey: `broadcast:${admin.id}:${value(formData, "idempotencyKey", false) || randomUUID()}`,
      typeKey,
      subject: value(formData, "subject"),
      body: value(formData, "body"),
      actor: { type: "ADMIN", adminUserId: admin.id },
      tenantIds: tenants.map((tenant) => tenant.id),
      audienceDefinition: { mode, explicitTenantIds: mode === "EXPLICIT" ? explicitIds : undefined },
      audienceDefinitionVersion: 1,
      scheduledAt,
    });
    revalidatePath("/admin/communications");
    revalidatePath("/admin/communications/broadcasts");
    revalidatePath("/dashboard/communication");
    recipientCount = result.recipientCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر نشر الإعلان.";
    redirect(`/admin/communications/broadcasts/new?error=${encodeURIComponent(message)}`);
  }
  redirect(`/admin/communications/broadcasts?published=${recipientCount}`);
}

export async function withdrawCommunicationBroadcastAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const campaignId = value(formData, "campaignId");
  try {
    await communicationCore.withdrawCampaign({
      campaignId,
      actor: { type: "ADMIN", adminUserId: admin.id },
      reason: value(formData, "reason"),
      idempotencyKey: `withdraw:${admin.id}:${value(formData, "idempotencyKey", false) || randomUUID()}`,
    });
    revalidatePath("/admin/communications/broadcasts");
    revalidatePath("/dashboard/communication");
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر سحب الإعلان.";
    redirect(`/admin/communications/broadcasts?error=${encodeURIComponent(message)}`);
  }
  redirect("/admin/communications/broadcasts?withdrawn=1");
}
