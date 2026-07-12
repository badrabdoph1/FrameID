import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";

describe("dashboard site actions", () => {
  it("copies the clean public link and opens the explicit owner view", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText
      }
    });

    render(<DashboardSiteActions siteUrl="https://frameid.app/p/ali" />);

    expect(
      screen.getByRole("link", { name: "شاهد الموقع كما يراه العميل" })
    ).toHaveAttribute("href", "https://frameid.app/p/ali?ownerView=1");

    fireEvent.click(
      screen.getByRole("button", {
        name: "انسخ رابط الموقع لإرساله للعميل"
      })
    );

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://frameid.app/p/ali");
    });
    expect(
      screen.getByRole("button", { name: "تم نسخ رابط الموقع" })
    ).toBeInTheDocument();
  });
});
