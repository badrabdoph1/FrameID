import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";

describe("marketing homepage", () => {
  it("communicates value proposition in 5 seconds", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /موقع خاص باسمك/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /يضم أعمالك كلها/i
      })
    ).toBeInTheDocument();
  });

  it("shows trust signals below hero CTAs", () => {
    render(<HomePage />);

    expect(screen.getByText("تجربة مجانية ١٤ يوم")).toBeInTheDocument();
    expect(screen.getByText("بدون بطاقة بنكية")).toBeInTheDocument();
    expect(screen.getByText("موقع جاهز خلال دقائق")).toBeInTheDocument();
  });

  it("has both primary and secondary CTAs", () => {
    render(<HomePage />);

    const signupLinks = screen.getAllByRole("link", {
      name: /ابدأ التجربة المجانية/u
    });
    expect(signupLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      signupLinks.every((link) => link.getAttribute("href") === "/signup")
    ).toBe(true);

    const templateLinks = screen.getAllByRole("link", {
      name: /شاهد القوالب/u
    });
    expect(templateLinks.length).toBeGreaterThanOrEqual(1);
    expect(
      templateLinks.every((link) => link.getAttribute("href") === "/templates")
    ).toBe(true);
  });

  it("shows template showcase with preview links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /قوالب جاهزة/i
      })
    ).toBeInTheDocument();
  });

  it("shows benefit cards", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /كل اللي يحتاجه المصور في مكان واحد/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText("معرض أعمال")).toBeInTheDocument();
    expect(screen.getByText("باقات وأسعار")).toBeInTheDocument();
    expect(screen.getByText("رابط خاص")).toBeInTheDocument();
    expect(screen.getByText("ظهور في Google")).toBeInTheDocument();
  });

  it("does not include admin panel section", () => {
    render(<HomePage />);

    expect(screen.queryByText("لوحة الأدمن")).not.toBeInTheDocument();
    expect(screen.queryByText("لوحة المصور ليست لوحة الأدمن")).not.toBeInTheDocument();
    expect(screen.queryByText("الأدمن الرئيسي يدير المنصة")).not.toBeInTheDocument();
  });

  it("does not contain fake testimonial names", () => {
    render(<HomePage />);

    expect(screen.queryByText("أحمد السعيد")).not.toBeInTheDocument();
    expect(screen.queryByText("سارة الغامدي")).not.toBeInTheDocument();
    expect(screen.queryByText("خالد المالكي")).not.toBeInTheDocument();
  });

  it("shows beta message instead of fake testimonials", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/سيتم عرض آراء المصورين بعد الإطلاق الرسمي/i)
    ).toBeInTheDocument();
  });

  it("shows faq section", () => {
    render(<HomePage />);

    expect(
      screen.getByText("إجابات سريعة")
    ).toBeInTheDocument();
  });

  it("shows how it works section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/كيف تبدا/i)
    ).toBeInTheDocument();
  });

  it("shows comparison section", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/ليه تدفع لإعلان إنستغرام/i)
    ).toBeInTheDocument();
  });

  it("shows how many steps", () => {
    render(<HomePage />);

    expect(
      screen.getByText(/٤ خطوات فقط/i)
    ).toBeInTheDocument();
  });
});
