import { describe, expect, it } from "vitest";

import {
  buildAdminInboxWhere,
  buildCustomerConversationWhere,
  buildCustomerInboxWhere,
  customerTimelineEntryWhere,
} from "@/modules/communication-center/query-contract";

describe("communication center query contract", () => {
  it("scopes every customer inbox query through the tenant audience", () => {
    expect(buildCustomerInboxWhere(" tenant-1 ")).toEqual({
      tenantId: "tenant-1",
      deliveredAt: { not: null },
      archivedAt: null,
      withdrawnAt: null,
      conversation: {
        lifecycleState: "ACTIVE",
      },
    });
  });

  it("requires both the conversation id and tenant audience for customer detail", () => {
    expect(buildCustomerConversationWhere("conversation-1", "tenant-1")).toEqual({
      id: "conversation-1",
      audiences: {
        some: { tenantId: "tenant-1", deliveredAt: { not: null }, archivedAt: null, withdrawnAt: null },
      },
    });
  });

  it("never exposes admin-only timeline entries to customers", () => {
    expect(customerTimelineEntryWhere()).toEqual({
      visibility: "CUSTOMER_AND_ADMIN",
      redactedAt: null,
    });
  });

  it("builds product-neutral admin filters and exact numeric search", () => {
    expect(buildAdminInboxWhere({
      search: " 1042 ",
      status: "WAITING_CUSTOMER",
      priority: "HIGH",
      queueKey: " Billing ",
      assigneeAdminUserId: "admin-1",
      typeKey: " payment.review ",
    })).toEqual({
      mode: "DIRECT",
      number: 1042,
      typeKey: "payment.review",
      workItem: {
        status: "WAITING_CUSTOMER",
        priority: "HIGH",
        queueKey: "billing",
        assigneeAdminUserId: "admin-1",
      },
    });
  });

  it("searches subject and customer identity without copying product data", () => {
    expect(buildAdminInboxWhere({ search: "نور" })).toEqual({
      mode: "DIRECT",
      OR: [
        { subject: { contains: "نور", mode: "insensitive" } },
        { tenant: { displayName: { contains: "نور", mode: "insensitive" } } },
        { tenant: { owner: { name: { contains: "نور", mode: "insensitive" } } } },
        { tenant: { owner: { email: { contains: "نور", mode: "insensitive" } } } },
      ],
    });
  });
});
