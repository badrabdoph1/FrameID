import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

describe("design system primitives", () => {
  it("renders an accessible button with variant styles", () => {
    render(<Button variant="primary">تفعيل موقعي</Button>);

    const button = screen.getByRole("button", { name: "تفعيل موقعي" });
    expect(button).toHaveClass("rounded-[var(--radius-control)]");
  });

  it("renders a badge with status semantics", () => {
    render(<Badge tone="success">Trial</Badge>);

    expect(screen.getByText("Trial")).toHaveClass("bg-success-soft");
  });

  it("composes card sections without nesting layout assumptions", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>رابط الموقع</CardTitle>
        </CardHeader>
        <CardContent>frameid.app/p/ali</CardContent>
      </Card>
    );

    expect(screen.getByText("رابط الموقع")).toBeInTheDocument();
    expect(screen.getByText("frameid.app/p/ali")).toBeInTheDocument();
  });
});
