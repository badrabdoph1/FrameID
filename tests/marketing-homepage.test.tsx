import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";

describe("marketing homepage", () => {
  it("talks about the photographer not the platform", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /محتاج موقع يلم شغلك كله في مكان واحد؟/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /كده هيبقي شكل موقعك\./i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /إيه اللي هيتغير في شغلك لما يبقى ليك موقع؟/i
      })
    ).toBeInTheDocument();
  });

  it("shows trust signals below hero CTAs", () => {
    render(<HomePage />);

    expect(screen.getByText("١٤ يوم تجربة مجانية")).toBeInTheDocument();
    expect(screen.getByText("مش محتاج بطاقة بنكية")).toBeInTheDocument();
    expect(screen.getByText("موقعك جاهز في دقايق")).toBeInTheDocument();
  });

  it("has limited strategic CTAs not 7+", () => {
    render(<HomePage />);

    const signupLinks = screen.getAllByRole("link", {
      name: /جرب مجاناً/u
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
      name: /شوف القوالب/u
    });
    expect(templateLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      templateLinks.every((link) => link.getAttribute("href") === "/templates")
    ).toBe(true);
  });

  it("routes homepage start and example CTAs to the templates index", () => {
    render(<HomePage />);

    const startLinks = screen.getAllByRole("link", {
      name: /ابدأ/u
    });
    expect(
      startLinks.every((link) => link.getAttribute("href") === "/templates")
    ).toBe(true);

    const exampleLinks = screen.getAllByRole("link", {
      name: /شوف مثال|شوف المثال/u
    });
    expect(
      exampleLinks.every((link) => link.getAttribute("href") === "/templates")
    ).toBe(true);
  });

  it("shows template showcase with browser frame", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /كده هيبقي شكل موقعك\./i
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/frameid\.app/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows photographer-focused benefit cards with بدل ما", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /إيه اللي هيتغير في شغلك لما يبقى ليك موقع؟/i
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
      screen.getByText(/ليه تثق في FrameID؟/i)
    ).toBeInTheDocument();
  });

  it("shows how it works section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/إزاي تبدا؟/i)
    ).toBeInTheDocument();
  });

  it("shows before-after concept in benefits section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/قبل FrameID وبعده/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /إيه اللي هيتغير في شغلك لما يبقى ليك موقع؟/i
      })
    ).toBeInTheDocument();
  });

  it("shows faq items", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/هل أحتاج بطاقة بنكية عشان أجرب؟/i)
    ).toBeInTheDocument();
  });

  it("shows photographer type badges in templates section", () => {
    render(<HomePage />);

    expect(screen.getByText("مصورين زفاف")).toBeInTheDocument();
    expect(screen.getByText("استوديوهات تصوير")).toBeInTheDocument();
  });
});
