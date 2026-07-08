import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  BuilderNotice,
  BuilderPageHeader,
} from "@/components/dashboard/builder-primitives";

describe("dashboard builder primitives", () => {
  it("renders a goal-oriented page header", () => {
    render(
      <BuilderPageHeader
        eyebrow="بيانات الموقع"
        title="عرّف العملاء عليك"
        description="أضف الاسم والصور وطرق التواصل التي تظهر في موقعك."
      />,
    );

    expect(screen.getByText("بيانات الموقع")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "عرّف العملاء عليك" })).toBeInTheDocument();
  });

  it("renders actionable notices with status semantics", () => {
    render(
      <BuilderNotice
        tone="success"
        title="تم الحفظ"
        description="آخر تغيير ظهر على موقعك."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("تم الحفظ");
    expect(screen.getByText("آخر تغيير ظهر على موقعك.")).toBeInTheDocument();
  });
});
