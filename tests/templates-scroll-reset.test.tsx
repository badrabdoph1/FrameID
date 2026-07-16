import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TemplatesScrollReset } from "@/app/(marketing)/templates/templates-scroll-reset";

describe("templates scroll reset", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/templates");
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      },
    });
  });

  it("removes the templates grid hash on first load and keeps the page at the top", async () => {
    window.history.replaceState(null, "", "/templates#templates-grid");

    render(<TemplatesScrollReset />);

    await waitFor(() => {
      expect(window.location.hash).toBe("");
    });
    expect(window.location.pathname).toBe("/templates");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("does not change other template page hashes", () => {
    window.history.replaceState(null, "", "/templates#main-content");

    render(<TemplatesScrollReset />);

    expect(window.location.hash).toBe("#main-content");
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
