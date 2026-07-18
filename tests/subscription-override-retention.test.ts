import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const activationWriters = [
  "src/modules/billing/prisma-billing-activation-repository.ts",
  "src/modules/admin/customers/customer-admin-repository.ts",
  "src/modules/admin/customers/prisma-customer-subscription-editor-repository.ts",
];

describe("subscription experience override retention", () => {
  it.each(activationWriters)("does not delete customer overrides from %s", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    const deletesSubscriptionOverride = /featureFlag\.deleteMany\([\s\S]{0,260}platform\.subscription\.experience\.override/u.test(source);
    expect(deletesSubscriptionOverride).toBe(false);
  });
});
