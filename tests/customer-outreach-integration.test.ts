import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("customer outreach integration", () => {
  it("routes single-customer messages through a direct conversation and bulk messages through campaigns", async () => {
    const actions = await readFile("src/app/(admin)/admin/customers/actions.ts", "utf8");

    expect(actions).toContain('from "@/modules/messages/customer-outreach-service"');
    expect(actions.match(/createCustomerOutreachCampaign\(/g)).toHaveLength(1);
    expect(actions).toContain("communicationCore.openConversation");
    expect(actions.match(/requireAdminPermission\("messages", "edit"\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(actions).toContain('action === "notify"');
    expect(actions).not.toContain('action === "notify" || action === "email"');
    expect(actions).toContain("إرسال البريد الجماعي غير مفعّل");
    expect(actions).not.toContain('type: "admin_bulk_message"');
    expect(actions).not.toContain('category: "customer_lifecycle"');
  });
});
