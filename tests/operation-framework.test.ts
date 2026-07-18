import { describe, expect, it } from "vitest";

import {
  canClaimOperation,
  computeOperationProgress,
  requestOperationControl,
} from "@/modules/operations/operation-state";

describe("operation framework state rules", () => {
  it("allows another runner to claim a running operation after its lease expires", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");

    expect(
      canClaimOperation({
        status: "RUNNING",
        leaseExpiresAt: new Date("2026-07-18T11:59:59.000Z"),
        now,
      }),
    ).toBe(true);
  });

  it("keeps a running operation locked while its lease is still active", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");

    expect(
      canClaimOperation({
        status: "RUNNING",
        leaseExpiresAt: new Date("2026-07-18T12:01:00.000Z"),
        now,
      }),
    ).toBe(false);
  });

  it("clamps progress between zero and one", () => {
    expect(computeOperationProgress({ processedItems: 12, totalItems: 10 })).toBe(1);
    expect(computeOperationProgress({ processedItems: -1, totalItems: 10 })).toBe(0);
    expect(computeOperationProgress({ processedItems: 3, totalItems: 12 })).toBe(0.25);
  });

  it("turns pause and cancel requests into explicit cooperative statuses", () => {
    expect(requestOperationControl({ status: "RUNNING", control: "PAUSE" })).toEqual({
      accepted: true,
      status: "PAUSE_REQUESTED",
    });

    expect(requestOperationControl({ status: "RUNNING", control: "CANCEL" })).toEqual({
      accepted: true,
      status: "CANCEL_REQUESTED",
    });
  });

  it("rejects control requests for terminal operations", () => {
    expect(requestOperationControl({ status: "SUCCEEDED", control: "CANCEL" })).toEqual({
      accepted: false,
      status: "SUCCEEDED",
      reason: "TERMINAL_OPERATION",
    });
  });
});
