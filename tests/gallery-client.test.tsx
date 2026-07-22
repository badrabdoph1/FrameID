import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GalleryClient } from "@/app/(dashboard)/dashboard/gallery/gallery-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/(dashboard)/dashboard/site-info/actions", () => ({
  uploadSiteImageAction: vi.fn(),
}));

vi.mock("@/app/(dashboard)/dashboard/gallery/actions", () => ({
  replaceGallerySlotAction: vi.fn(),
  toggleGallerySectionAction: vi.fn(),
}));

describe("gallery client", () => {
  it("shows the current cover preview in a compact replacement card", () => {
    render(
      <GalleryClient
        coverUrl="https://example.com/current-cover.jpg"
        galleryVisible
        slotImages={[]}
        toggled={false}
        coverReplaced={false}
      />,
    );

    expect(screen.getByAltText("معاينة الغلاف الحالي")).toHaveAttribute(
      "src",
      "https://example.com/current-cover.jpg",
    );
    expect(screen.getByRole("button", { name: /استبدال صورة الغلاف/ })).toHaveClass("w-full");
  });
});
