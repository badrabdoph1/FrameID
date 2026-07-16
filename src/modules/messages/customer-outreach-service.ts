import {
  buildCustomerOutreachAudienceWhere,
  customerOutreachStatuses,
  normalizeCustomerOutreachInput,
  type CustomerOutreachInput,
  type CustomerOutreachStatus,
} from "@/modules/messages/customer-outreach";
import { CUSTOMER_BROADCAST_CATEGORY } from "@/modules/messages/customer-message-config";

type AdminActor = { id: string; name: string; email: string };
type OutreachTenant = {
  id: string;
  displayName: string;
  ownerUserId: string;
  owner: { name: string; email: string };
};

type OutreachTransaction = {
  tenant: { findMany(args: Record<string, unknown>): Promise<OutreachTenant[]> };
  customerMessageCampaign: {
    create(args: Record<string, unknown>): Promise<{ id: string }>;
    update(args: Record<string, unknown>): Promise<{ id: string; status: string; _count: { recipients: number } }>;
  };
  customerMessageRecipient: { createMany(args: Record<string, unknown>): Promise<unknown> };
  notification: { createMany(args: Record<string, unknown>): Promise<unknown> };
  notificationLog: { createMany(args: Record<string, unknown>): Promise<unknown> };
  auditLog: { create(args: Record<string, unknown>): Promise<unknown> };
};

type OutreachPrisma = {
  $transaction<T>(work: (transaction: OutreachTransaction) => Promise<T>): Promise<T>;
};

const OUTREACH_WRITE_BATCH_SIZE = 500;

function splitIntoBatches<T>(items: T[]): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += OUTREACH_WRITE_BATCH_SIZE) {
    batches.push(items.slice(index, index + OUTREACH_WRITE_BATCH_SIZE));
  }
  return batches;
}

export async function createCustomerOutreachCampaign(
  prisma: unknown,
  input: CustomerOutreachInput,
  actor: AdminActor,
): Promise<{ campaignId: string; recipientCount: number }> {
  const normalized = normalizeCustomerOutreachInput(input);
  const client = prisma as OutreachPrisma;

  return client.$transaction(async (transaction) => {
    const audienceWhere = normalized.audienceMode === "EXPLICIT"
      ? { deletedAt: null, id: { in: normalized.tenantIds } }
      : buildCustomerOutreachAudienceWhere(normalized.filters);
    const tenants = await transaction.tenant.findMany({
      where: audienceWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        ownerUserId: true,
        owner: { select: { name: true, email: true } },
      },
    });
    if (tenants.length === 0) throw new Error("لا يوجد عملاء مطابقون للجمهور المحدد.");
    if (normalized.audienceMode === "EXPLICIT") {
      const resolvedIds = new Set(tenants.map((tenant) => tenant.id));
      if (resolvedIds.size !== normalized.tenantIds.length || normalized.tenantIds.some((tenantId) => !resolvedIds.has(tenantId))) {
        throw new Error("تعذر العثور على بعض العملاء المحددين. حدّث القائمة وحاول مرة أخرى.");
      }
    }

    const campaign = await transaction.customerMessageCampaign.create({
      data: {
        title: normalized.title,
        body: normalized.body,
        tone: normalized.tone,
        status: "ACTIVE",
        audienceMode: normalized.audienceMode,
        audienceSnapshot: normalized.filters,
        createdByAdminId: actor.id,
        createdByName: actor.name,
      },
      select: { id: true },
    });
    const recipients = tenants.map((tenant) => ({
      campaignId: campaign.id,
      tenantId: tenant.id,
      tenantName: tenant.displayName,
      ownerName: tenant.owner.name,
      ownerEmail: tenant.owner.email,
    }));
    const notifications = tenants.map((tenant) => ({
      tenantId: tenant.id,
      type: `customer_campaign:${campaign.id}`,
      title: normalized.title,
      body: normalized.body,
      priority: normalized.tone === "danger" ? "high" : normalized.tone,
    }));
    const notificationLogs = tenants.map((tenant) => ({
      tenantId: tenant.id,
      type: normalized.tone,
      title: normalized.title,
      body: normalized.body,
      category: CUSTOMER_BROADCAST_CATEGORY,
    }));

    for (const batch of splitIntoBatches(recipients)) {
      await transaction.customerMessageRecipient.createMany({ data: batch });
    }
    for (const batch of splitIntoBatches(notifications)) {
      await transaction.notification.createMany({ data: batch });
    }
    for (const batch of splitIntoBatches(notificationLogs)) {
      await transaction.notificationLog.createMany({ data: batch });
    }
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "CUSTOMER_MESSAGE_CAMPAIGN_CREATED",
        entityType: "CustomerMessageCampaign",
        entityId: campaign.id,
        metadata: {
          recipientCount: tenants.length,
          audienceMode: normalized.audienceMode,
          filters: normalized.filters,
          adminEmail: actor.email,
        },
      },
    });

    return { campaignId: campaign.id, recipientCount: tenants.length };
  });
}

export async function setCustomerOutreachCampaignStatus(
  prisma: unknown,
  campaignId: string,
  status: CustomerOutreachStatus,
  actor: AdminActor,
) {
  if (!campaignId.trim()) throw new Error("معرف الحملة مطلوب.");
  if (!customerOutreachStatuses.includes(status)) throw new Error("حالة الحملة غير صالحة.");
  const client = prisma as OutreachPrisma;

  return client.$transaction(async (transaction) => {
    const campaign = await transaction.customerMessageCampaign.update({
      where: { id: campaignId },
      data: { status, pausedAt: status === "PAUSED" ? new Date() : null },
      select: { id: true, status: true, _count: { select: { recipients: true } } },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: status === "PAUSED" ? "CUSTOMER_MESSAGE_CAMPAIGN_PAUSED" : "CUSTOMER_MESSAGE_CAMPAIGN_RESUMED",
        entityType: "CustomerMessageCampaign",
        entityId: campaignId,
        metadata: { status, recipientCount: campaign._count.recipients, adminName: actor.name, adminEmail: actor.email },
      },
    });
    return campaign;
  });
}
