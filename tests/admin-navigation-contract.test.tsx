import { describe, expect, it } from "vitest";

import {
  adminRoutes,
  adminSections,
  getAdminBreadcrumbs,
  getAdminRoute,
} from "@/modules/admin/navigation";

describe("admin navigation contract", () => {
  it("keeps every registered route and daily destination unique", () => {
    const routeIds = adminRoutes.map((route) => route.id);
    const routeHrefs = adminRoutes.map((route) => route.href);
    const dailyHrefs = adminSections.flatMap((section) =>
      section.links.map((link) => link.href),
    );

    expect(new Set(routeIds).size).toBe(routeIds.length);
    expect(new Set(routeHrefs).size).toBe(routeHrefs.length);
    expect(new Set(dailyHrefs).size).toBe(dailyHrefs.length);
  });

  it("gives every route a clear Arabic identity and section", () => {
    expect(adminRoutes.length).toBeGreaterThanOrEqual(39);

    for (const route of adminRoutes) {
      expect(route.labelAr.trim().length).toBeGreaterThan(1);
      expect(route.descriptionAr.trim().length).toBeGreaterThan(5);
      expect(route.sectionId.trim().length).toBeGreaterThan(0);
      expect(route.keywords.length).toBeGreaterThan(0);
    }
  });

  it("resolves nested customer, site, issue and editor routes", () => {
    expect(getAdminRoute("/admin/communications")?.id).toBe("communications");
    expect(getAdminRoute("/admin/customers/customer-1")?.id).toBe(
      "customer-details",
    );
    expect(getAdminRoute("/admin/sites/site-1")?.id).toBe("site-details");
    expect(getAdminRoute("/admin/errors/issue-1")?.id).toBe("issue-details");
    expect(getAdminRoute("/admin/page-studio/home")?.id).toBe(
      "page-studio-editor",
    );
    expect(getAdminRoute("/admin/content/marketing/homepage")?.id).toBe(
      "content-editor",
    );
  });

  it("builds Arabic breadcrumbs from the same route registry", () => {
    expect(
      getAdminBreadcrumbs("/admin/settings/payment").map((item) => item.label),
    ).toEqual(["لوحة الإدارة", "الإعدادات", "وسائل الدفع"]);

    expect(
      getAdminBreadcrumbs("/admin/customers/customer-1").map(
        (item) => item.label,
      ),
    ).toEqual(["لوحة الإدارة", "العملاء", "ملف العميل"]);
  });

  it("keeps advanced tools out of the daily destinations without losing them", () => {
    const dailyHrefs = new Set(
      adminSections.flatMap((section) =>
        section.links.map((link) => link.href),
      ),
    );

    expect(dailyHrefs.has("/admin/feature-flags")).toBe(false);
    expect(dailyHrefs.has("/admin/admin-users")).toBe(false);
    expect(getAdminRoute("/admin/feature-flags")?.visibility).toBe("advanced");
    expect(getAdminRoute("/admin/admin-users")?.visibility).toBe("advanced");
  });
});
