import { describe, expect, it } from "vitest";

import { createEntitlementService, type EntitlementRepository } from "@/modules/services-platform/entitlement-service";

describe("entitlement service", () => {
  it("grants idempotently and revokes the source without changing tenant status", async () => {
    const events: string[] = [];
    const repository: EntitlementRepository = {
      async upsertGrant(input) { events.push(`grant:${input.tenantId}:${input.sourceType}:${input.sourceId}`); return { id: "ent_1" }; },
      async revokeSource(input) { events.push(`revoke:${input.tenantId}:${input.sourceType}:${input.sourceId}:${input.reason}`); return 2; },
      async listActive() { return []; },
    };
    const service = createEntitlementService(repository);

    await service.grant({ tenantId: "tenant_1", capabilityKey: "storage.gb", value: 20, sourceType: "SUBSCRIPTION", sourceId: "sub_1" });
    await service.revokeSource({ tenantId: "tenant_1", sourceType: "SUBSCRIPTION", sourceId: "sub_1", reason: "REFUNDED" });

    expect(events).toEqual(["grant:tenant_1:SUBSCRIPTION:sub_1", "revoke:tenant_1:SUBSCRIPTION:sub_1:REFUNDED"]);
  });
});
