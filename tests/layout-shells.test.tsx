import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminShell } from "@/components/layout/admin-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";

describe("application shells", () => {
  it("renders photographer dashboard navigation as a reusable shell", () => {
    render(
      <DashboardShell>
        <p>Dashboard content</p>
      </DashboardShell>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "لوحة المصور" })).toBeInTheDocument();
  });

  it("renders super admin navigation as a reusable shell", () => {
    render(
      <AdminShell>
        <p>Admin content</p>
      </AdminShell>
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "لوحة الإدارة" })).toBeInTheDocument();
  });
});
