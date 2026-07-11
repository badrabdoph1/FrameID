import { describe, expect, it } from "vitest";

import { assertIssueTransition, canTransitionIssue } from "@/modules/customer-issues/state-machine";

describe("customer issue state machine", () => {
  it.each([
    ["NEW", "IN_REVIEW"],
    ["IN_REVIEW", "RESOLVED"],
    ["RESOLVED", "CLOSED"],
    ["RESOLVED", "IN_REVIEW"],
    ["CLOSED", "IN_REVIEW"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransitionIssue(from, to)).toBe(true);
    expect(() => assertIssueTransition(from, to)).not.toThrow();
  });

  it.each([
    ["NEW", "CLOSED"],
    ["CLOSED", "RESOLVED"],
    ["IN_REVIEW", "IN_REVIEW"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransitionIssue(from, to)).toBe(false);
    expect(() => assertIssueTransition(from, to)).toThrow("انتقال حالة البلاغ غير مسموح");
  });
});
