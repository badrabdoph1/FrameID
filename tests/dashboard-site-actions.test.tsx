import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";

describe("dashboard site actions", () => {
  it("copies the public site link and links editing to the content screen", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText
      }
    });

    render(<DashboardSiteActions siteUrl="https://frameid.app/p/ali" />);

    fireEvent.click(screen.getByRole("button", { name: "نسخ الرابط" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://frameid.app/p/ali");
    });
    expect(screen.getByRole("button", { name: "تم النسخ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تعديل الموقع" })).toHaveAttribute(
      "href",
      "/dashboard/content"
    );
  });
});
