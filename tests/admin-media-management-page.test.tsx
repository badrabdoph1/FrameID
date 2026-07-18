import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  mediaAsset: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "asset-1",
        url: "https://raw.githubusercontent.com/org/repo/main/public/uploads/a.webp",
        storageKey: "tenant/a.webp",
        kind: "image",
        mimeType: "image/webp",
        sizeBytes: 100,
        width: 100,
        height: 100,
        alt: "Hero",
        checksumSha256: "same",
        createdAt: new Date("2026-07-18T10:00:00.000Z"),
        tenant: { id: "tenant-1", displayName: "Ramy Wedding Photography" },
        _count: {
          galleryImages: 1,
          albumCovers: 0,
          contactAvatars: 0,
          contactCovers: 0,
          seoOgImages: 0,
          paymentProofs: 0,
          paymentQRCodes: 0,
          paymentSettingsQR: 0,
        },
      },
      {
        id: "asset-2",
        url: "/uploads/tenant/b.webp",
        storageKey: "tenant/b.webp",
        kind: "image",
        mimeType: "image/webp",
        sizeBytes: 120,
        width: 100,
        height: 100,
        alt: null,
        checksumSha256: "same",
        createdAt: new Date("2026-07-18T11:00:00.000Z"),
        tenant: { id: "tenant-1", displayName: "Ramy Wedding Photography" },
        _count: {
          galleryImages: 0,
          albumCovers: 0,
          contactAvatars: 0,
          contactCovers: 0,
          seoOgImages: 0,
          paymentProofs: 0,
          paymentQRCodes: 0,
          paymentSettingsQR: 0,
        },
      },
    ]),
  },
  template: { findMany: vi.fn().mockResolvedValue([]) },
  paymentSettings: { findMany: vi.fn().mockResolvedValue([]) },
  operation: {
    findMany: vi.fn().mockResolvedValue([
      {
        id: "operation-1",
        type: "MEDIA_SCAN",
        status: "SUCCEEDED",
        progress: 1,
        processedItems: 2,
        totalItems: 2,
        createdAt: new Date("2026-07-18T12:00:00.000Z"),
        finishedAt: new Date("2026-07-18T12:01:00.000Z"),
      },
    ]),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/admin/admin-permission-guards", () => ({
  requireAdminPermission: vi.fn().mockResolvedValue({ id: "admin-1", name: "Admin", role: "SUPER_ADMIN" }),
}));
vi.mock("@/components/layout/admin-page-shell", () => ({
  AdminPageShell: ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) =>
    React.createElement("main", null, React.createElement("h1", null, title), React.createElement("p", null, description), children),
}));
vi.mock("@/app/(admin)/admin/media/media-table-client", () => ({
  MediaTableClient: () => React.createElement("div", null, "جدول الوسائط"),
}));

import AdminMediaPage from "@/app/(admin)/admin/media/page";

describe("admin media management page", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://test";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("renders a real media management center instead of a simple library table", async () => {
    render(await AdminMediaPage());

    expect(screen.getByRole("heading", { name: "إدارة الوسائط" })).toBeInTheDocument();
    expect(screen.getByText("فحص الوسائط")).toBeInTheDocument();
    expect(screen.getByText("التنظيف الذكي")).toBeInTheDocument();
    expect(screen.getByText("سلة الوسائط")).toBeInTheDocument();
    expect(screen.getByText("التكرارات")).toBeInTheDocument();
    expect(screen.getByText("سلامة البيانات")).toBeInTheDocument();
    expect(screen.getByText("العمليات الطويلة")).toBeInTheDocument();

    expect(screen.getByText("الصور المستخدمة")).toBeInTheDocument();
    expect(screen.getByText("الصور غير المستخدمة")).toBeInTheDocument();
    expect(screen.getByText("الصور المكررة")).toBeInTheDocument();
    expect(screen.getByText("الصور التالفة")).toBeInTheDocument();
    expect(screen.getByText("الصور المفقودة")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getAllByText("النسخ الاحتياطية").length).toBeGreaterThan(0);
    expect(screen.getByText("آخر فحص")).toBeInTheDocument();
    expect(screen.getByText("آخر تنظيف")).toBeInTheDocument();
    expect(screen.getByText("جدول الوسائط")).toBeInTheDocument();
  });
});
