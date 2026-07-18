import { describe, expect, it } from "vitest";

import { buildCommunicationAudienceWhere } from "@/modules/communication-center/audience-resolver";

describe("communication campaign audience resolver", () => {
  it("selects active subscribers from subscription truth", () => {
    expect(buildCommunicationAudienceWhere({ mode: "SUBSCRIBED" })).toEqual({
      deletedAt: null,
      subscriptions: { some: { deletedAt: null, status: "ACTIVE" } },
    });
  });

  it("selects expired customers without encoding product rules in the core", () => {
    expect(buildCommunicationAudienceWhere({ mode: "EXPIRED" })).toEqual({
      deletedAt: null,
      OR: [
        { status: { in: ["TRIAL_EXPIRED", "EXPIRED"] } },
        { subscriptions: { some: { deletedAt: null, status: { in: ["EXPIRED", "CANCELLED"] } } } },
      ],
    });
  });

  it("deduplicates an explicit audience", () => {
    expect(buildCommunicationAudienceWhere({ mode: "EXPLICIT", tenantIds: ["tenant-1", " tenant-1 ", "tenant-2"] })).toEqual({
      deletedAt: null,
      id: { in: ["tenant-1", "tenant-2"] },
    });
  });
});
