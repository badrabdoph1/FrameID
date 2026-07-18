import { describe, expect, it } from "vitest";

import {
  computeMediaTrashEligibility,
  computePurgeEligibleAt,
  reconcileTrashedMediaUsage,
} from "@/modules/media/media-lifecycle";

describe("media lifecycle", () => {
  it("uses a 30 day default retention window when moving media to trash", () => {
    const trashedAt = new Date("2026-07-18T10:00:00.000Z");

    expect(computePurgeEligibleAt({ trashedAt })).toEqual(new Date("2026-08-17T10:00:00.000Z"));
  });

  it("reports remaining days before trashed media becomes eligible for purge", () => {
    const eligibility = computeMediaTrashEligibility({
      lifecycleStatus: "IN_TRASH",
      usageStatus: "UNUSED",
      purgeEligibleAt: new Date("2026-08-17T10:00:00.000Z"),
      now: new Date("2026-08-05T09:30:00.000Z"),
      currentReferenceCount: 0,
    });

    expect(eligibility).toEqual({
      eligible: false,
      status: "WAITING_RETENTION",
      daysRemaining: 13,
      reasons: ["RETENTION_NOT_EXPIRED"],
    });
  });

  it("only marks media eligible for purge after retention and a fresh unused reference check", () => {
    const eligibility = computeMediaTrashEligibility({
      lifecycleStatus: "IN_TRASH",
      usageStatus: "UNUSED",
      purgeEligibleAt: new Date("2026-08-17T10:00:00.000Z"),
      now: new Date("2026-08-18T10:00:00.000Z"),
      currentReferenceCount: 0,
    });

    expect(eligibility.eligible).toBe(true);
    expect(eligibility.status).toBe("ELIGIBLE_FOR_PURGE");
    expect(eligibility.daysRemaining).toBe(0);
  });

  it("blocks purge when a trashed media item is referenced again", () => {
    const eligibility = computeMediaTrashEligibility({
      lifecycleStatus: "IN_TRASH",
      usageStatus: "UNUSED",
      purgeEligibleAt: new Date("2026-08-17T10:00:00.000Z"),
      now: new Date("2026-08-18T10:00:00.000Z"),
      currentReferenceCount: 2,
    });

    expect(eligibility).toMatchObject({
      eligible: false,
      status: "BLOCKED_BY_CURRENT_USAGE",
      daysRemaining: 0,
    });
  });

  it("reactivates trashed media when current references appear before purge", () => {
    const result = reconcileTrashedMediaUsage({
      lifecycleStatus: "IN_TRASH",
      usageStatus: "UNUSED",
      currentReferenceCount: 1,
    });

    expect(result).toEqual({
      lifecycleStatus: "ACTIVE",
      usageStatus: "USED",
      changed: true,
      reason: "CURRENT_USAGE_DETECTED",
    });
  });
});
