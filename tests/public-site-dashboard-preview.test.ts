import { describe, expect, it } from "vitest";

import {
  buildDashboardPreviewUrl,
  isDashboardPreviewRequest,
} from "@/modules/public-sites/dashboard-preview";
import { createContentSecurityPolicy } from "@/lib/security/content-security-policy";

describe("public site dashboard preview", () => {
  it("adds a dedicated preview marker without changing the public share URL", () => {
    expect(buildDashboardPreviewUrl("https://frameid.app/p/ali")).toBe(
      "https://frameid.app/p/ali?dashboardPreview=1"
    );
    expect(buildDashboardPreviewUrl("/p/ali?theme=noir")).toBe(
      "/p/ali?theme=noir&dashboardPreview=1"
    );
  });

  it("allows same-origin framing only for marked public-site requests", () => {
    expect(
      isDashboardPreviewRequest({ pathname: "/p/ali", marker: "1" })
    ).toBe(true);
    expect(
      isDashboardPreviewRequest({ pathname: "/p/ali", marker: null })
    ).toBe(false);
    expect(
      isDashboardPreviewRequest({ pathname: "/dashboard", marker: "1" })
    ).toBe(false);

    expect(createContentSecurityPolicy("'self'")).toContain("frame-ancestors 'self'");
    expect(createContentSecurityPolicy("'none'")).toContain("frame-ancestors 'none'");
  });
});
