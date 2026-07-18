"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { processError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { communicationLegacyBridge } from "@/modules/communication-center/runtime";
import {
  createCustomerOutreachCampaign,
  setCustomerOutreachCampaignStatus,
} from "@/modules/messages/customer-outreach-service";
import type { CustomerOutreachStatus } from "@/modules/messages/customer-outreach";

function redirectToWorkspace(params: Record<string, string | number>) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  redirect(`/admin/messages/customer-outreach?${query.toString()}`);
}

export async function createCustomerOutreachCampaignAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  let recipientCount = 0;
  try {
    const result = await createCustomerOutreachCampaign(prisma, {
      title: readFormString(formData, "title"),
      body: readFormString(formData, "body"),
      tone: readFormString(formData, "tone"),
      audienceMode: readFormString(formData, "audienceMode"),
      tenantIds: formData.getAll("tenantIds").map(String),
      filters: {
        search: readFormString(formData, "search"),
        tenantStatus: readFormString(formData, "tenantStatus"),
        subscriptionStatus: readFormString(formData, "subscriptionStatus"),
        planId: readFormString(formData, "planId"),
      },
    }, admin, communicationLegacyBridge);

    revalidatePath("/admin/messages/customer-outreach");
    revalidatePath("/admin/customers");
    revalidatePath("/dashboard");
    recipientCount = result.recipientCount;
  } catch (error) {
    const { userError } = await processError(error, {
      userId: admin.id,
      metadata: { action: "createCustomerOutreachCampaign" },
    });
    redirectToWorkspace({ error: userError.message });
  }

  redirectToWorkspace({ sent: recipientCount });
}

export async function setCustomerOutreachCampaignStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const campaignId = readFormString(formData, "campaignId");
  const rawStatus = readFormString(formData, "status");
  const status = rawStatus as CustomerOutreachStatus;

  try {
    if (rawStatus !== "ACTIVE" && rawStatus !== "PAUSED") throw new Error("حالة الحملة غير صالحة.");
    await setCustomerOutreachCampaignStatus(prisma, campaignId, status, admin);
    revalidatePath("/admin/messages/customer-outreach");
    revalidatePath("/dashboard");
  } catch (error) {
    const { userError } = await processError(error, {
      userId: admin.id,
      metadata: { action: "setCustomerOutreachCampaignStatus", campaignId, status },
    });
    redirectToWorkspace({ error: userError.message });
  }

  redirectToWorkspace({ statusChanged: status });
}
