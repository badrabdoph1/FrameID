import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingNav } from "@/components/layout/marketing-nav";

describe("marketing nav", () => {
  it("exposes all primary links from a mobile menu", () => {
    render(<MarketingNav />);

    const menuButton = screen.getByRole("button", { name: "القائمة" });
    fireEvent.click(menuButton);
    const mobileMenu = screen.getByRole("navigation", { name: "قائمة الموقع" });

    expect(within(mobileMenu).getByRole("link", { name: "القوالب" })).toHaveAttribute(
      "href",
      "/templates"
    );
    expect(within(mobileMenu).getByRole("link", { name: "دخول" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(within(mobileMenu).getByRole("link", { name: "إنشاء حساب" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });
});
