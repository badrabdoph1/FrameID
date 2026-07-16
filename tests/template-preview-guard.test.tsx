import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TemplatePreviewGuard } from "@/components/themes/template-preview-guard";

describe("template preview guard", () => {
  it("lets internal package links scroll inside the preview", () => {
    render(
      <>
        <TemplatePreviewGuard />
        <a href="#packages">الأسعار والباكدج</a>
      </>,
    );

    const event = fireEvent.click(screen.getByRole("link", { name: "الأسعار والباكدج" }));

    expect(event).toBe(true);
  });

  it("keeps real external contact links disabled in template previews", () => {
    render(
      <>
        <TemplatePreviewGuard />
        <a href="https://wa.me/201000000000">واتساب</a>
      </>,
    );

    const event = fireEvent.click(screen.getByRole("link", { name: "واتساب" }));

    expect(event).toBe(false);
  });
});
