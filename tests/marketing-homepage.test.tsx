import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";

describe("marketing homepage", () => {
  it("talks about the photographer not the platform", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /بدل ما تتوه أعمالك/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /موقع واحد يضم كل شيء/i
      })
    ).toBeInTheDocument();
  });

  it("shows trust signals below hero CTAs", () => {
    render(<HomePage />);

    expect(screen.getByText("تجربة مجانية ١٤ يوم")).toBeInTheDocument();
    expect(screen.getByText("بدون بطاقة بنكية")).toBeInTheDocument();
    expect(screen.getByText("موقع جاهز خلال دقائق")).toBeInTheDocument();
  });

  it("has limited strategic CTAs not 7+", () => {
    render(<HomePage />);

    const signupLinks = screen.getAllByRole("link", {
      name: /ابدأ التجربة المجانية/u
    });
    expect(signupLinks.length).toBeGreaterThanOrEqual(1);
    expect(signupLinks.length).toBeLessThanOrEqual(3);
    expect(
      signupLinks.every((link) => link.getAttribute("href") === "/signup")
    ).toBe(true);
  });

  it("has secondary template CTAs", () => {
    render(<HomePage />);

    const templateLinks = screen.getAllByRole("link", {
      name: /شاهد القوالب/u
    });
    expect(templateLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      templateLinks.every((link) => link.getAttribute("href") === "/templates")
    ).toBe(true);
  });

  it("shows template showcase with browser frame", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /هذا شكل موقعك/i
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/frameid.app/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows photographer-focused benefit cards with بدل ما", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /كل بطاقة = فائدة حقيقية لمصور زيك/i
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/بدل ما/i).length).toBeGreaterThanOrEqual(6);
  });

  it("does not include admin panel section", () => {
    render(<HomePage />);

    expect(screen.queryByText("لوحة الأدمن")).not.toBeInTheDocument();
    expect(screen.queryByText("لوحة المصور ليست لوحة الأدمن")).not.toBeInTheDocument();
  });

  it("does not contain fake testimonial names", () => {
    render(<HomePage />);

    expect(screen.queryByText("أحمد السعيد")).not.toBeInTheDocument();
    expect(screen.queryByText("سارة الغامدي")).not.toBeInTheDocument();
    expect(screen.queryByText("خالد المالكي")).not.toBeInTheDocument();
  });

  it("shows beta message not fake testimonials", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/FrameID لسه جديد/i)
    ).toBeInTheDocument();
  });

  it("shows how it works section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/كيف تبدا/i)
    ).toBeInTheDocument();
  });

  it("shows before-after comparison section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/قبل FrameID وبعده/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/الفرق واضح/i)
    ).toBeInTheDocument();
  });

  it("shows faq items", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/هل أحتاج بطاقة ائتمان/i)
    ).toBeInTheDocument();
  });

  it("shows for-whom photographer type badges", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/لمن هذه المنصة/i)
    ).toBeInTheDocument();
    expect(screen.getByText("مصوري الزفاف")).toBeInTheDocument();
    expect(screen.getByText("الاستوديوهات")).toBeInTheDocument();
  });
});
