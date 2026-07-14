import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => React.createElement("a", { href, ...props }, children) }));

import { SitesTable, type SiteRow } from "@/app/(admin)/admin/sites/sites-table";
import { domainStatusLabel, sectionTypeLabel, siteStatusLabel } from "@/modules/admin/sites/site-presentation";

const site: SiteRow = { id: "site-1", slug: "ali", title: "Ali Studio", status: "PUBLISHED", isPublished: true, createdAt: "2026-07-01T00:00:00.000Z", tenantName: "Ali", themeName: "Classic" };

describe("admin site workspace", () => {
  it("uses Arabic presentation labels for system states", () => {
    expect(siteStatusLabel("PUBLISHED")).toBe("منشور");
    expect(domainStatusLabel("PENDING")).toBe("بانتظار التحقق");
    expect(sectionTypeLabel("HERO")).toBe("الواجهة الرئيسية");
  });

  it("links mobile site cards to one clear workspace", () => {
    render(<SitesTable data={[site]} />);
    const list = screen.getByRole("list", { name: "قائمة البيانات للموبايل" });
    const card = within(list).getByRole("listitem", { name: "Ali Studio" });
    expect(within(card).getByText("منشور")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "فتح الموقع" })).toHaveAttribute("href", "/admin/sites/site-1");
    expect(within(card).queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("explains an empty site list", () => {
    render(<SitesTable data={[]} />);
    expect(screen.getAllByText("لا توجد مواقع مطابقة").length).toBeGreaterThan(0);
  });
});
