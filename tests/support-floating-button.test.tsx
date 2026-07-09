import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  pathname: "/templates"
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

import { SupportFloatingButton } from "@/components/support/support-floating-button";

describe("support floating button", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    navigationState.pathname = "/templates";
  });

  it("stays out of public marketing pages", () => {
    for (const pathname of ["/", "/templates", "/templates/noir-gold/preview", "/login", "/signup"]) {
      navigationState.pathname = pathname;
      const { unmount } = render(<SupportFloatingButton />);

      expect(screen.queryByRole("button", { name: "فتح الدعم الفني" })).not.toBeInTheDocument();
      expect(globalThis.fetch).not.toHaveBeenCalled();

      unmount();
    }
  });

  it("still appears inside the customer dashboard", () => {
    navigationState.pathname = "/dashboard";

    render(<SupportFloatingButton />);

    expect(screen.getByRole("button", { name: "فتح الدعم الفني" })).toBeInTheDocument();
  });
});
