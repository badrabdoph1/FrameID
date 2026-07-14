import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(admin)/admin/payments/actions", () => ({ approvePaymentAction: vi.fn(), rejectPaymentAction: vi.fn(), requestReuploadAction: vi.fn(), addPaymentNoteAction: vi.fn() }));

import { AdminPaymentsClient } from "@/app/(admin)/admin/payments/admin-payments-client";

describe("admin billing surfaces", () => {
  it("restores the payment queue selected by the URL", () => {
    render(<AdminPaymentsClient payments={[]} stats={{ pendingCount: 0, approvedThisMonth: 0, totalRevenue: 0, avgReviewHours: null }} banner={null} initialTab="completed" />);
    expect(screen.getByRole("button", { name: "مكتملة" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "قيد المراجعة" })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a calm, specific empty state for the selected queue", () => {
    render(<AdminPaymentsClient payments={[]} stats={{ pendingCount: 0, approvedThisMonth: 0, totalRevenue: 0, avgReviewHours: null }} banner={null} initialTab="pending" />);
    expect(screen.getByText("لا توجد طلبات دفع تنتظر المراجعة.")).toBeInTheDocument();
  });
});
