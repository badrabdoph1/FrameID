import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("dashboard customer outreach delivery", () => {
  it("loads only active campaigns sent to the current tenant", async () => {
    const page = await readFile("src/app/(dashboard)/dashboard/page.tsx", "utf8");

    expect(page).toContain("prisma.customerMessageRecipient.findMany");
    expect(page).toContain('campaign: { status: "ACTIVE" }');
    expect(page).toContain("campaign.title");
    expect(page).toContain("campaign.body");
    expect(page).not.toContain("CUSTOMER_BROADCAST_CATEGORY");
  });

  it("keeps the customer message card readable for multiline campaign copy", async () => {
    const client = await readFile("src/app/(dashboard)/dashboard/home-client.tsx", "utf8");

    expect(client).toContain("whitespace-pre-wrap");
    expect(client).not.toContain("block truncate text-[0.68rem]");
  });
});
