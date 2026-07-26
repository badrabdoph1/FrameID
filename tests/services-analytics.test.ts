import { describe, expect, it } from "vitest";

import { buildServicesFunnel } from "@/modules/services-platform/analytics-service";

describe("services analytics funnel", () => {
  it("deduplicates actors per stage and calculates step conversion", () => {
    const funnel = buildServicesFunnel([
      { name: "catalog.viewed", actorKey: "t1" },
      { name: "catalog.viewed", actorKey: "t1" },
      { name: "offering.viewed", actorKey: "t1" },
      { name: "acquisition.requested", actorKey: "t1" },
      { name: "catalog.viewed", actorKey: "t2" },
      { name: "offering.viewed", actorKey: "t2" },
    ]);
    expect(funnel.stages).toEqual([
      { name: "catalog.viewed", actors: 2, conversionFromPrevious: 1 },
      { name: "offering.viewed", actors: 2, conversionFromPrevious: 1 },
      { name: "acquisition.requested", actors: 1, conversionFromPrevious: 0.5 },
      { name: "payment.submitted", actors: 0, conversionFromPrevious: 0 },
      { name: "acquisition.fulfilled", actors: 0, conversionFromPrevious: 0 },
    ]);
    expect(funnel.overallConversion).toBe(0);
  });
});
