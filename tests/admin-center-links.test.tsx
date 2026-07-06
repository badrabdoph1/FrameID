import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminCenterLinks } from "@/components/admin/admin-center-links";

describe("admin center links", () => {
  it("renders console centers as real Arabic navigation links", () => {
    render(<AdminCenterLinks />);

    expect(screen.getByRole("link", { name: /مركز الأمان/ })).toHaveAttribute(
      "href",
      "/admin/security"
    );
    expect(screen.getByRole("link", { name: /مراجعة المدفوعات/ })).toHaveAttribute(
      "href",
      "/admin/payments"
    );
    expect(screen.getByRole("link", { name: /مركز النسخ الاحتياطي/ })).toHaveAttribute(
      "href",
      "/admin/backups"
    );
    expect(screen.getByRole("link", { name: /صحة النظام/ })).toHaveAttribute(
      "href",
      "/admin/health"
    );
  });
});
