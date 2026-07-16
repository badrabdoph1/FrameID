import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  buildCustomerOutreachAudienceWhere,
  normalizeCustomerOutreachInput,
} from "@/modules/messages/customer-outreach";

describe("customer outreach contract", () => {
  it("normalizes valid campaign copy, tone, audience mode and explicit recipients", () => {
    expect(normalizeCustomerOutreachInput({
      title: "  تحديث مهم  ",
      body: "  راجع لوحة التحكم لمعرفة التفاصيل.  ",
      tone: "warning",
      audienceMode: "EXPLICIT",
      tenantIds: ["tenant-1", "tenant-1", "tenant-2", ""],
      filters: {},
    })).toEqual({
      title: "تحديث مهم",
      body: "راجع لوحة التحكم لمعرفة التفاصيل.",
      tone: "warning",
      audienceMode: "EXPLICIT",
      tenantIds: ["tenant-1", "tenant-2"],
      filters: {},
    });
  });

  it("rejects missing recipients, blank copy and oversized fields", () => {
    expect(() => normalizeCustomerOutreachInput({ title: "", body: "نص", tone: "info", audienceMode: "ALL_MATCHING", tenantIds: [], filters: {} })).toThrow("عنوان الرسالة مطلوب");
    expect(() => normalizeCustomerOutreachInput({ title: "عنوان", body: "", tone: "info", audienceMode: "ALL_MATCHING", tenantIds: [], filters: {} })).toThrow("نص الرسالة مطلوب");
    expect(() => normalizeCustomerOutreachInput({ title: "x".repeat(121), body: "نص", tone: "info", audienceMode: "ALL_MATCHING", tenantIds: [], filters: {} })).toThrow("120");
    expect(() => normalizeCustomerOutreachInput({ title: "عنوان", body: "x".repeat(1201), tone: "info", audienceMode: "ALL_MATCHING", tenantIds: [], filters: {} })).toThrow("1200");
    expect(() => normalizeCustomerOutreachInput({ title: "عنوان", body: "نص", tone: "info", audienceMode: "EXPLICIT", tenantIds: [], filters: {} })).toThrow("عميلًا واحدًا");
    expect(() => normalizeCustomerOutreachInput({ title: "عنوان", body: "نص", tone: "unknown", audienceMode: "ALL_MATCHING", tenantIds: [], filters: {} })).toThrow("نوع الرسالة");
    expect(() => normalizeCustomerOutreachInput({ title: "عنوان", body: "نص", tone: "info", audienceMode: "unknown", tenantIds: [], filters: {} })).toThrow("طريقة تحديد الجمهور");
  });

  it("builds a deleted-safe audience query from combined customer filters", () => {
    expect(buildCustomerOutreachAudienceWhere({
      search: "سارة",
      tenantStatus: "ACTIVE",
      subscriptionStatus: "ACTIVE",
      planId: "plan-pro",
    })).toEqual({
      deletedAt: null,
      status: "ACTIVE",
      OR: [
        { displayName: { contains: "سارة", mode: "insensitive" } },
        { owner: { name: { contains: "سارة", mode: "insensitive" } } },
        { owner: { email: { contains: "سارة", mode: "insensitive" } } },
      ],
      subscriptions: {
        some: { deletedAt: null, status: "ACTIVE", planId: "plan-pro" },
      },
    });
  });

  it("rejects unsupported filters and keeps empty filters deleted-safe", () => {
    expect(() => buildCustomerOutreachAudienceWhere({
      tenantStatus: "UNKNOWN",
      subscriptionStatus: "UNKNOWN",
      planId: "",
      search: "  ",
    })).toThrow("حالة العميل");
    expect(buildCustomerOutreachAudienceWhere({ planId: "", search: "  " })).toEqual({ deletedAt: null });
  });

  it("preserves recipient snapshots when a customer is permanently deleted", async () => {
    const [schema, migration] = await Promise.all([
      readFile("prisma/schema.prisma", "utf8"),
      readFile("prisma/migrations/20260717120000_add_customer_message_campaigns/migration.sql", "utf8"),
    ]);

    expect(schema).toContain("tenantId   String?");
    expect(schema).toContain("tenant   Tenant?                 @relation");
    expect(migration).toContain('"tenantId" TEXT,');
    expect(migration).toContain("ON DELETE SET NULL ON UPDATE CASCADE");
  });
});
