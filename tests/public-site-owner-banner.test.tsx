import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

import { PublicSiteOwnerBanner } from "@/components/public-sites/public-site-owner-banner";

describe("public site owner banner", () => {
  it("explains owner view and links back to the dashboard", () => {
    render(<PublicSiteOwnerBanner />);

    expect(
      screen.getByText("أنت الآن تشاهد موقعك كما يراه العميل.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "العودة إلى لوحة الإدارة" })
    ).toHaveAttribute("href", "/dashboard");
  });
});
