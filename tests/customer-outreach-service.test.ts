import { describe, expect, it, vi } from "vitest";

import {
  createCustomerOutreachCampaign,
  setCustomerOutreachCampaignStatus,
} from "@/modules/messages/customer-outreach-service";

function createFakePrisma() {
  const calls: Array<{ name: string; input: unknown }> = [];
  const tenants = [
    { id: "tenant-1", displayName: "استوديو سارة", ownerUserId: "user-1", owner: { name: "سارة", email: "sara@example.com" } },
    { id: "tenant-2", displayName: "عدسة نور", ownerUserId: "user-2", owner: { name: "نور", email: "nour@example.com" } },
  ];
  const tx = {
    tenant: {
      findMany: vi.fn(async (input: unknown) => {
        calls.push({ name: "tenant.findMany", input });
        return tenants;
      }),
    },
    customerMessageCampaign: {
      create: vi.fn(async (input: unknown) => {
        calls.push({ name: "campaign.create", input });
        return { id: "campaign-1" };
      }),
      update: vi.fn(async (input: unknown) => {
        calls.push({ name: "campaign.update", input });
        return { id: "campaign-1", status: (input as { data: { status: string } }).data.status, _count: { recipients: 2 } };
      }),
    },
    customerMessageRecipient: { createMany: vi.fn(async (input: unknown) => { calls.push({ name: "recipient.createMany", input }); return { count: 2 }; }) },
    notification: { createMany: vi.fn(async (input: unknown) => { calls.push({ name: "notification.createMany", input }); return { count: 2 }; }) },
    notificationLog: { createMany: vi.fn(async (input: unknown) => { calls.push({ name: "notificationLog.createMany", input }); return { count: 2 }; }) },
    auditLog: { create: vi.fn(async (input: unknown) => { calls.push({ name: "auditLog.create", input }); return { id: "audit-1" }; }) },
  };
  return {
    calls,
    tx,
    prisma: { $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)) },
  };
}

const actor = { id: "admin-1", name: "المدير", email: "admin@frameid.com" };

describe("customer outreach service", () => {
  it("creates one transactional campaign with deduplicated explicit recipients and compatibility notifications", async () => {
    const fake = createFakePrisma();
    const result = await createCustomerOutreachCampaign(fake.prisma, {
      title: "تنبيه جديد",
      body: "راجع تحديثات حسابك.",
      tone: "info",
      audienceMode: "EXPLICIT",
      tenantIds: ["tenant-1", "tenant-1", "tenant-2"],
      filters: {},
    }, actor);

    expect(result).toEqual({ campaignId: "campaign-1", recipientCount: 2 });
    expect(fake.prisma.$transaction).toHaveBeenCalledOnce();
    const recipientWrite = fake.calls.find((call) => call.name === "recipient.createMany")?.input as { data: unknown[] };
    const notificationWrite = fake.calls.find((call) => call.name === "notification.createMany")?.input as { data: Array<{ type: string }> };
    expect(recipientWrite.data).toHaveLength(2);
    expect(notificationWrite.data).toHaveLength(2);
    expect(notificationWrite.data[0]?.type).toBe("customer_campaign:campaign-1");
    expect(fake.calls.map((call) => call.name)).toContain("auditLog.create");
  });

  it("publishes the committed legacy campaign through an injected communication adapter", async () => {
    const fake = createFakePrisma();
    const published: unknown[] = [];

    await createCustomerOutreachCampaign(fake.prisma, {
      title: "تحديث المنصة",
      body: "أصبح التحديث متاحًا.",
      tone: "success",
      audienceMode: "EXPLICIT",
      tenantIds: ["tenant-1", "tenant-2"],
      filters: {},
    }, actor, {
      async publishCampaign(input) {
        published.push(input);
      },
    });

    expect(published).toEqual([expect.objectContaining({
      campaignId: "campaign-1",
      tenantIds: ["tenant-1", "tenant-2"],
      title: "تحديث المنصة",
      tone: "success",
    })]);
  });

  it("fails atomically when the resolved audience is empty", async () => {
    const fake = createFakePrisma();
    fake.tx.tenant.findMany.mockResolvedValueOnce([]);

    await expect(createCustomerOutreachCampaign(fake.prisma, {
      title: "تنبيه",
      body: "نص الرسالة",
      tone: "info",
      audienceMode: "ALL_MATCHING",
      tenantIds: [],
      filters: { tenantStatus: "ACTIVE" },
    }, actor)).rejects.toThrow("لا يوجد عملاء");

    expect(fake.calls.map((call) => call.name)).not.toContain("campaign.create");
  });

  it("rejects an explicit audience when any submitted customer is missing or deleted", async () => {
    const fake = createFakePrisma();

    await expect(createCustomerOutreachCampaign(fake.prisma, {
      title: "تنبيه",
      body: "نص الرسالة",
      tone: "info",
      audienceMode: "EXPLICIT",
      tenantIds: ["tenant-1", "tenant-2", "deleted-tenant"],
      filters: {},
    }, actor)).rejects.toThrow("تعذر العثور على بعض العملاء");

    expect(fake.calls.map((call) => call.name)).not.toContain("campaign.create");
  });

  it("batches large audiences to stay below database parameter limits", async () => {
    const fake = createFakePrisma();
    const tenants = Array.from({ length: 1001 }, (_, index) => ({
      id: `tenant-${index}`,
      displayName: `عميل ${index}`,
      ownerUserId: `user-${index}`,
      owner: { name: `مالك ${index}`, email: `owner-${index}@example.com` },
    }));
    fake.tx.tenant.findMany.mockResolvedValueOnce(tenants);

    const result = await createCustomerOutreachCampaign(fake.prisma, {
      title: "رسالة كبيرة",
      body: "نص الرسالة",
      tone: "info",
      audienceMode: "ALL_MATCHING",
      tenantIds: [],
      filters: {},
    }, actor);

    expect(result.recipientCount).toBe(1001);
    expect(fake.calls.filter((call) => call.name === "recipient.createMany")).toHaveLength(3);
    expect(fake.calls.filter((call) => call.name === "notification.createMany")).toHaveLength(3);
    expect(fake.calls.filter((call) => call.name === "notificationLog.createMany")).toHaveLength(3);
  });

  it("pauses and resumes a campaign with an audit entry", async () => {
    const fake = createFakePrisma();

    await setCustomerOutreachCampaignStatus(fake.prisma, "campaign-1", "PAUSED", actor);
    await setCustomerOutreachCampaignStatus(fake.prisma, "campaign-1", "ACTIVE", actor);

    const updates = fake.calls.filter((call) => call.name === "campaign.update").map((call) => call.input as { data: { status: string; pausedAt: Date | null } });
    expect(updates[0]?.data.status).toBe("PAUSED");
    expect(updates[0]?.data.pausedAt).toBeInstanceOf(Date);
    expect(updates[1]?.data).toEqual({ status: "ACTIVE", pausedAt: null });
    expect(fake.calls.filter((call) => call.name === "auditLog.create")).toHaveLength(2);
    const lastAudit = fake.calls.filter((call) => call.name === "auditLog.create").at(-1)?.input as { data: { metadata: { recipientCount: number } } };
    expect(lastAudit.data.metadata.recipientCount).toBe(2);
  });
});
