import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  template: { count: vi.fn().mockResolvedValue(2) },
  theme: { count: vi.fn().mockResolvedValue(2) },
  mediaAsset: {
    count: vi.fn().mockResolvedValue(12),
    findMany: vi.fn().mockResolvedValue([{ id: "asset-1", storageKey: "photo.jpg", mimeType: "image/jpeg", sizeBytes: 1000, createdAt: new Date() }])
  },
  platformPage: {
    findMany: vi.fn().mockResolvedValue([
      { key: "home", version: 3, updatedAt: new Date("2026-07-15T00:00:00.000Z") },
    ]),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/content", () => ({
  getManifest: () => ({
    "marketing/homepage": { version: 1, updatedAt: "2026-07-10T00:00:00.000Z" }
  })
}));
vi.mock("@/modules/admin/admin-permission-guards", () => ({ requireAdminPermission: vi.fn() }));
vi.mock("@/components/layout/admin-page-shell", () => ({
  AdminPageShell: ({ children }: { children: React.ReactNode }) => React.createElement("main", null, children)
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => React.createElement("a", { href, ...props }, children)
}));

import AdminContentPage from "@/app/(admin)/admin/content/page";

describe("admin content workspace", () => {
  it("publishes every content destination once", async () => {
    render(await AdminContentPage());

    const hrefs = [...document.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(hrefs.filter((href) => href === "/admin/templates")).toHaveLength(1);
    expect(hrefs.filter((href) => href === "/admin/themes")).toHaveLength(1);
    expect(hrefs.filter((href) => href === "/admin/media")).toHaveLength(1);
    expect(screen.queryByText("سجل القوالب")).not.toBeInTheDocument();
  });

  it("does not duplicate the media library as a recent-files section", async () => {
    render(await AdminContentPage());

    expect(screen.queryByRole("heading", { name: "آخر الوسائط" })).not.toBeInTheDocument();
    expect(prismaMock.mediaAsset.findMany).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "صفحات المنصة" })).toBeInTheDocument();
  });

  it("makes content the only page workspace entry point", async () => {
    render(await AdminContentPage());

    expect(screen.getByRole("link", { name: /الصفحة الرئيسية/ })).toHaveAttribute(
      "href",
      "/admin/content/pages/home",
    );
    expect(document.querySelector('a[href="/admin/page-studio"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/content/marketing/homepage"]')).not.toBeInTheDocument();
    expect(screen.getByText("متاحة للتحرير")).toBeInTheDocument();
  });
});
