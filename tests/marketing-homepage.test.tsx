import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";

describe("marketing homepage", () => {
  it("speaks to photographers with a clear trial path", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "موقعك كمصور جاهز للإرسال قبل أول رسالة للعميل."
      })
    ).toBeInTheDocument();
    expect(screen.getByText("لا يوجد دفع قبل التجربة")).toBeInTheDocument();
    expect(screen.getByText("اختر قالبًا حيًا")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /شاهد القوالب الحية/u })
    ).toHaveAttribute("href", "/templates");
  });
});
