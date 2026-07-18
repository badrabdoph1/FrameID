import { describe, expect, it } from "vitest";

import { assertWorkItemTransition } from "@/modules/communication-core/state-machine";
import {
  assertConversationScope,
  assertEntryAccess,
  normalizeActor,
  normalizeContextReference,
} from "@/modules/communication-core/validation";

describe("communication work item state machine", () => {
  it.each([
    ["NEW", "IN_PROGRESS"],
    ["NEW", "WAITING_CUSTOMER"],
    ["IN_PROGRESS", "WAITING_CUSTOMER"],
    ["IN_PROGRESS", "WAITING_INTERNAL"],
    ["IN_PROGRESS", "RESOLVED"],
    ["WAITING_CUSTOMER", "IN_PROGRESS"],
    ["WAITING_INTERNAL", "IN_PROGRESS"],
    ["RESOLVED", "IN_PROGRESS"],
    ["RESOLVED", "CLOSED"],
    ["CLOSED", "IN_PROGRESS"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(() => assertWorkItemTransition(from, to)).not.toThrow();
  });

  it.each([
    ["NEW", "RESOLVED"],
    ["WAITING_CUSTOMER", "CLOSED"],
    ["CLOSED", "NEW"],
    ["RESOLVED", "WAITING_CUSTOMER"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(() => assertWorkItemTransition(from, to)).toThrow("انتقال حالة غير مسموح");
  });
});

describe("communication core invariant validation", () => {
  it("requires one tenant for direct conversations and no tenant for broadcasts", () => {
    expect(() => assertConversationScope("DIRECT", "tenant-1")).not.toThrow();
    expect(() => assertConversationScope("BROADCAST", null)).not.toThrow();
    expect(() => assertConversationScope("DIRECT", null)).toThrow("عميل");
    expect(() => assertConversationScope("BROADCAST", "tenant-1")).toThrow("الجمهور");
  });

  it("prevents customers from creating internal or admin-only entries", () => {
    const customer = { type: "CUSTOMER", userId: "user-1" } as const;

    expect(() => assertEntryAccess(customer, "MESSAGE", "CUSTOMER_AND_ADMIN")).not.toThrow();
    expect(() => assertEntryAccess(customer, "INTERNAL_NOTE", "ADMIN_ONLY")).toThrow("العميل");
    expect(() => assertEntryAccess(customer, "MESSAGE", "ADMIN_ONLY")).toThrow("العميل");
  });

  it("normalizes product-neutral context keys while preserving opaque IDs", () => {
    expect(normalizeContextReference({
      namespace: " Services ",
      entityType: " Acquisition ",
      entityId: "ACQ_01HXYZ",
      relationKey: " Primary ",
    })).toEqual({
      namespace: "services",
      entityType: "acquisition",
      entityId: "ACQ_01HXYZ",
      relationKey: "primary",
    });

    expect(() => normalizeContextReference({
      namespace: "billing module",
      entityType: "payment",
      entityId: "payment-1",
      relationKey: "primary",
    })).toThrow("namespace");
  });

  it("requires exactly the identifier belonging to the actor kind", () => {
    expect(normalizeActor({ type: "SYSTEM", systemKey: "services.fulfillment" })).toEqual({
      type: "SYSTEM",
      systemKey: "services.fulfillment",
    });
    expect(() => normalizeActor({ type: "SYSTEM", systemKey: " " })).toThrow("هوية النظام");
    expect(() => normalizeActor({ type: "ADMIN", adminUserId: " " })).toThrow("هوية الأدمن");
  });
});
