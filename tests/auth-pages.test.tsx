import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

import ForgotPasswordPage from "@/app/(marketing)/forgot-password/page";
import ResetPasswordPage from "@/app/(marketing)/reset-password/page";

describe("auth pages", () => {
  it("shows password reset request errors inside the page", async () => {
    render(
      await ForgotPasswordPage({
        searchParams: Promise.resolve({
          error: "قاعدة البيانات غير متصلة حاليًا. شغّل قاعدة البيانات ثم حاول مرة أخرى."
        })
      })
    );

    expect(
      screen.getByText(
        "قاعدة البيانات غير متصلة حاليًا. شغّل قاعدة البيانات ثم حاول مرة أخرى."
      )
    ).toBeInTheDocument();
  });

  it("shows reset-password action errors inside the page", async () => {
    render(
      await ResetPasswordPage({
        searchParams: Promise.resolve({
          error: "قاعدة البيانات غير متصلة حاليًا. شغّل قاعدة البيانات ثم حاول مرة أخرى."
        })
      })
    );

    expect(
      screen.getByText(
        "قاعدة البيانات غير متصلة حاليًا. شغّل قاعدة البيانات ثم حاول مرة أخرى."
      )
    ).toBeInTheDocument();
  });
});
