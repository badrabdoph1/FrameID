import { describe, expect, it } from "vitest";

import { sanitizeIssuePayload, sanitizeIssueUrl } from "@/modules/customer-issues/sanitize";

describe("customer issue sanitizer", () => {
  it("removes secrets recursively while preserving diagnostics", () => {
    expect(sanitizeIssuePayload({
      password: "never-store",
      authorization: "Bearer secret",
      browser: "Chrome 126",
      device: "Pixel",
      nested: {
        cookie: "session=secret",
        csrfToken: "secret",
        screenSize: "1440x900",
      },
    })).toEqual({
      browser: "Chrome 126",
      device: "Pixel",
      nested: { screenSize: "1440x900" },
    });
  });

  it("removes sensitive query values from URLs and referrers", () => {
    expect(sanitizeIssueUrl("https://frameid.app/dashboard?tab=sites&token=secret&code=oauth-code"))
      .toBe("https://frameid.app/dashboard?tab=sites");
  });

  it("bounds strings, arrays, nesting, and object size", () => {
    const payload = sanitizeIssuePayload({
      message: "x".repeat(5_000),
      events: Array.from({ length: 80 }, (_, index) => index),
      deep: { one: { two: { three: { four: { secret: "discarded" } } } } },
    });

    expect(String(payload.message).length).toBeLessThanOrEqual(2_000);
    expect(payload.events).toHaveLength(30);
    expect(payload.deep).toEqual({ one: { two: { three: "[depth-limit]" } } });
  });
});
