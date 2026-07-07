import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";

describe("marketing homepage", () => {
  it("keeps the homepage minimal, premium, and mobile-first", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "موقع مصور احترافي خلال دقائق."
      })
    ).toBeInTheDocument();
    expect(screen.getByText("لا يوجد دفع قبل التجربة")).toBeInTheDocument();
    expect(screen.getByText("قالب حي")).toBeInTheDocument();
    const templateLinks = screen.getAllByRole("link", {
      name: /شاهد القوالب/u
    });

    expect(templateLinks.length).toBeGreaterThanOrEqual(1);
    expect(templateLinks.every((link) => link.getAttribute("href") === "/templates")).toBe(
      true
    );
    expect(screen.queryByText("قبل أن تسأل")).not.toBeInTheDocument();
    expect(screen.queryByText("الخطة المعمارية أولًا")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "من قالب حي إلى موقع مستقل ولوحة تحكم."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "الحساب، الموقع، الرابط الخاص، لوحة التحكم، والاشتراك التجريبي تُنشأ معًا بعد التسجيل."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "لوحة المصور ليست لوحة الأدمن."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "الأدمن الرئيسي يدير المنصة والعملاء والمدفوعات والقوالب، ولا يختلط مع لوحات المصورين."
      )
    ).toBeInTheDocument();
  });
});
