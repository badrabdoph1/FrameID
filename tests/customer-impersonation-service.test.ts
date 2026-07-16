import { describe, expect, it } from "vitest";

import { createCustomerDashboardImpersonation } from "@/modules/admin/customers/customer-impersonation";

describe("customer dashboard impersonation", () => {
  it("creates an owner dashboard session, records impersonation, and returns a dashboard redirect", async () => {
    const events: string[] = [];
    const expiresAt = new Date("2026-07-17T13:00:00.000Z");

    const result = await createCustomerDashboardImpersonation({
      tenantId: "tenant-1",
      actor: { id: "admin-1", name: "Admin User" },
      now: () => new Date("2026-07-17T12:00:00.000Z"),
      createSession: async ({ userId }) => {
        events.push(`session:${userId}`);
        return {
          id: "session-1",
          userId,
          expiresAt,
          cookie: {
            name: "frameid_session",
            value: "raw-token",
            options: {
              expires: expiresAt,
              httpOnly: true,
              path: "/",
              sameSite: "lax",
              secure: false,
            },
          },
        };
      },
      repository: {
        async findTenantForDashboardImpersonation(tenantId) {
          events.push(`find:${tenantId}`);
          return {
            id: tenantId,
            displayName: "استوديو أحمد",
            ownerUserId: "owner-1",
            firstSiteId: "site-1",
          };
        },
        async createImpersonationSession(input) {
          events.push(`impersonation:${input.adminId}:${input.tenantId}:${input.expiresAt.toISOString()}`);
        },
        async createAuditLog(actorId, tenantId, action, entityType, entityId, metadata) {
          events.push(`audit:${actorId}:${tenantId}:${action}:${entityType}:${entityId}:${metadata.adminName}`);
        },
      },
    });

    expect(result.redirectTo).toBe("/dashboard");
    expect(result.cookie.value).toBe("raw-token");
    expect(events).toEqual([
      "find:tenant-1",
      "session:owner-1",
      "impersonation:admin-1:tenant-1:2026-07-17T13:00:00.000Z",
      "audit:admin-1:tenant-1:ADMIN_IMPERSONATED:Tenant:tenant-1:Admin User",
    ]);
  });

  it("rejects customers without a dashboard site", async () => {
    await expect(createCustomerDashboardImpersonation({
      tenantId: "tenant-1",
      actor: { id: "admin-1", name: "Admin User" },
      createSession: async () => {
        throw new Error("should not create a session");
      },
      repository: {
        async findTenantForDashboardImpersonation() {
          return {
            id: "tenant-1",
            displayName: "استوديو بدون موقع",
            ownerUserId: "owner-1",
            firstSiteId: null,
          };
        },
        async createImpersonationSession() {
          throw new Error("should not create impersonation");
        },
        async createAuditLog() {
          throw new Error("should not audit");
        },
      },
    })).rejects.toThrow("لا توجد لوحة تحكم جاهزة لهذا العميل.");
  });
});
