import { describe, expect, it } from "vitest";

import { createCustomerIssueHttpHandlers } from "@/modules/customer-issues/http";
import type { TrustedIssueContext } from "@/modules/customer-issues/context";

const trustedContext: TrustedIssueContext = {
  requestId: "req-trusted",
  correlationId: "corr-trusted",
  route: "/dashboard",
  method: "POST",
  url: "https://frameid.app/dashboard",
  ipAddress: "203.0.113.7",
  userAgent: "Chrome",
  userId: "user-trusted",
  tenantId: "tenant-trusted",
  siteId: "site-trusted",
  sessionId: "session-trusted",
  adminUserId: null,
  sourceArea: "CUSTOMER_DASHBOARD",
  environment: "test",
  releaseVersion: "0.1.0",
  buildVersion: "build-test",
  templateCode: "noir-gold",
};

describe("customer issue HTTP handlers", () => {
  it("captures diagnostics while ignoring spoofed identity fields", async () => {
    let captured: Record<string, unknown> | null = null;
    const handlers = createCustomerIssueHttpHandlers({
      resolveContext: async () => trustedContext,
      captureOccurrence: async (input) => {
        captured = input;
        return { id: "occ-1" };
      },
      reportIssue: async () => { throw new Error("not used"); },
      rateLimit: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 1_000 }),
    });
    const request = new Request("https://frameid.app/api/customer-issues/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "تعذر تحميل الصفحة",
        code: "FID-CLIENT-001",
        route: "/spoofed",
        userId: "user-attacker",
        tenantId: "tenant-attacker",
        siteId: "site-attacker",
        metadata: { browser: "Chrome", password: "secret" },
      }),
    });

    const response = await handlers.capture(request);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ occurrenceId: "occ-1" });
    expect(captured).toMatchObject({
      userId: "user-trusted",
      tenantId: "tenant-trusted",
      siteId: "site-trusted",
      route: "/dashboard",
      requestId: "req-trusted",
    });
    const recorded = captured as unknown as { metadata: Record<string, unknown> };
    expect(recorded.metadata).not.toHaveProperty("password");
  });

  it("supports anonymous reports from a trusted published-site context", async () => {
    let captured: Record<string, unknown> | null = null;
    const handlers = createCustomerIssueHttpHandlers({
      resolveContext: async () => ({
        ...trustedContext,
        route: "/p/ali-studio",
        userId: null,
        tenantId: "tenant-public",
        siteId: "site-public",
        sessionId: null,
        sourceArea: "PUBLIC_SITE",
      }),
      captureOccurrence: async (input) => { captured = input; return { id: "occ-public" }; },
      reportIssue: async () => { throw new Error("not used"); },
      rateLimit: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 1_000 }),
    });

    const response = await handlers.capture(new Request("https://frameid.app/api/customer-issues/capture", {
      method: "POST",
      body: JSON.stringify({ message: "تعذر العرض" }),
    }));

    expect(response.status).toBe(201);
    expect(captured).toMatchObject({ userId: null, tenantId: "tenant-public", siteId: "site-public", sourceArea: "PUBLIC_SITE" });
  });

  it("rejects invalid JSON, oversized messages, and rate-limited callers safely", async () => {
    const baseDeps = {
      resolveContext: async () => trustedContext,
      captureOccurrence: async () => ({ id: "occ-1" }),
      reportIssue: async () => { throw new Error("not used"); },
    };
    const allowed = createCustomerIssueHttpHandlers({
      ...baseDeps,
      rateLimit: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1_000 }),
    });
    const blocked = createCustomerIssueHttpHandlers({
      ...baseDeps,
      rateLimit: () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 }),
    });

    const invalid = await allowed.capture(new Request("https://frameid.app/api/customer-issues/capture", { method: "POST", body: "{" }));
    const oversized = await allowed.capture(new Request("https://frameid.app/api/customer-issues/capture", { method: "POST", body: JSON.stringify({ message: "x".repeat(2_001) }) }));
    const limited = await blocked.capture(new Request("https://frameid.app/api/customer-issues/capture", { method: "POST", body: JSON.stringify({ message: "error" }) }));

    expect(invalid.status).toBe(400);
    expect(oversized.status).toBe(400);
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toEqual({ message: "تم استلام محاولات كفاية دلوقتي. جرّب بعد شوية." });
  });

  it("promotes an occurrence to an issue without requiring a note", async () => {
    const handlers = createCustomerIssueHttpHandlers({
      resolveContext: async () => trustedContext,
      captureOccurrence: async () => ({ id: "occ-1" }),
      reportIssue: async (input) => ({
        merged: false,
        issue: { id: "issue-1", number: 42, occurrenceId: input.occurrenceId },
      }),
      rateLimit: () => ({ allowed: true, remaining: 3, resetAt: Date.now() + 1_000 }),
    });

    const response = await handlers.report(new Request("https://frameid.app/api/customer-issues/report", {
      method: "POST",
      body: JSON.stringify({ occurrenceId: "occ-1" }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ issueId: "issue-1", issueNumber: "ISS-000042", merged: false });
  });
});
