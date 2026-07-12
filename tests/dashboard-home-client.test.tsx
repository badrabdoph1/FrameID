import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardHomeClient } from "@/app/(dashboard)/dashboard/home-client";
import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

function createDashboard(overrides: Partial<DashboardViewModel> = {}): DashboardViewModel {
  return {
    photographerName: "Ali Ahmed Studio",
    siteTitle: "Ali Ahmed",
    siteSlug: "ali",
    siteUrl: "https://frameid.app/p/ali",
    statusLabel: "منشور",
    percent: 100,
    checklist: [
      { id: "package", label: "الباقات", done: true, href: "/dashboard/services", description: "الباقات", workspace: "sales" },
      { id: "contact", label: "التواصل", done: true, href: "/dashboard/site-info", description: "التواصل", workspace: "studio" },
      { id: "avatar", label: "الصورة", done: true, href: "/dashboard/gallery", description: "الصورة", workspace: "photos" },
      { id: "cover", label: "الغلاف", done: true, href: "/dashboard/gallery", description: "الغلاف", workspace: "photos" },
      { id: "album", label: "الألبوم", done: true, href: "/dashboard/gallery", description: "الألبوم", workspace: "photos" },
      { id: "seo", label: "المشاركة", done: true, href: "/dashboard/publish", description: "المشاركة", workspace: "publish" },
      { id: "publish", label: "النشر", done: true, href: "/dashboard/publish", description: "النشر", workspace: "publish" },
    ],
    phases: [],
    operatingAlerts: [],
    stats: [],
    lastModified: "الآن",
    currentTheme: "Noir Gold",
    isPublished: true,
    isReadyToPublish: true,
    nextStepHref: "/dashboard/publish",
    nextStepLabel: "شاهد الموقع كما يراه العميل",
    nextStepTitle: "الموقع منشور",
    nextStepDescription: "شاهد الموقع",
    subscription: null,
    customerMessages: [],
    activationMessages: {},
    ...overrides,
  };
}

describe("dashboard home client", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains the admin context and presents the real published site", async () => {
    render(<DashboardHomeClient {...createDashboard()} />);

    expect(screen.getByText("أنت الآن داخل لوحة إدارة موقعك.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "موقعك المنشور" })).toBeInTheDocument();
    expect(screen.getByText("الرابط الذي سترسله لعملائك")).toBeInTheDocument();
    expect(screen.getByTitle("معاينة موقع Ali Ahmed")).toHaveAttribute(
      "src",
      "https://frameid.app/p/ali?dashboardPreview=1"
    );

    const acknowledgeButton = await screen.findByRole("button", {
      name: "فهمت، لن يرى العملاء لوحة الإدارة"
    });
    fireEvent.click(acknowledgeButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "فهمت، لن يرى العملاء لوحة الإدارة" })
      ).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem("frameid:onboarding-checklist")).toContain(
      '"introAcknowledged":true'
    );
  });

  it("does not load a public iframe while the site is still a draft", () => {
    render(
      <DashboardHomeClient
        {...createDashboard({
          statusLabel: "مسودة",
          isPublished: false,
          percent: 71,
        })}
      />
    );

    expect(screen.queryByTitle(/معاينة موقع/)).not.toBeInTheDocument();
    expect(screen.getByText("الموقع ما زال مسودة")).toBeInTheDocument();
  });
});
