import { describe, expect, it } from "vitest";

import { createErrorFingerprint, extractSourceLocation } from "@/modules/customer-issues/fingerprint";

describe("customer issue fingerprint", () => {
  it("groups the same failure when route ids and query values change", () => {
    const first = createErrorFingerprint({
      code: "FID-DB-002",
      errorType: "PrismaClientKnownRequestError",
      route: "/dashboard/sites/site_123?token=secret&tab=content",
      stack: "Error: failed for customer 12345\n    at saveSite (/app/src/app/actions.ts:20:4)",
    });
    const second = createErrorFingerprint({
      code: "FID-DB-002",
      errorType: "PrismaClientKnownRequestError",
      route: "/dashboard/sites/site_987?token=other&tab=content",
      stack: "Error: failed for customer 98765\n    at saveSite (/app/src/app/actions.ts:20:4)",
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{32}$/);
  });

  it("keeps failures from different project files separate", () => {
    const common = {
      code: "FID-UNK-001",
      errorType: "Error",
      route: "/dashboard",
    };

    expect(createErrorFingerprint({ ...common, stack: "at save (/app/src/a.ts:1:1)" }))
      .not.toBe(createErrorFingerprint({ ...common, stack: "at save (/app/src/b.ts:1:1)" }));
  });

  it("uses a Next.js digest when no project stack frame is available", () => {
    const first = createErrorFingerprint({ code: "FID-UNK-001", route: "/", digest: "digest-a" });
    const second = createErrorFingerprint({ code: "FID-UNK-001", route: "/", digest: "digest-b" });

    expect(first).not.toBe(second);
  });

  it("extracts the first source file location inside the project", () => {
    expect(extractSourceLocation("Error\n at framework (/node_modules/next/a.js:1:2)\n at save (/app/src/modules/sites/save.ts:42:7)"))
      .toEqual({ file: "src/modules/sites/save.ts", line: 42, column: 7 });
  });
});
