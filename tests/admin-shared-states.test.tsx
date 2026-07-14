import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { AdminErrorState } from "@/components/layout/admin-error-state";
import { AdminPageSkeleton } from "@/components/layout/admin-loading-skeleton";

describe("admin shared states", () => {
  it("uses a direct default error message and a clear retry action", () => {
    const onRetry = vi.fn();
    render(<AdminErrorState onRetry={onRetry} />);

    expect(screen.getByRole("heading", { name: "تعذر تحميل البيانات" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("announces page loading without exposing decorative skeletons", () => {
    render(<AdminPageSkeleton />);

    expect(screen.getByRole("status", { name: "جار تحميل الصفحة" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("keeps an empty state explanation and next action together", () => {
    render(
      <AdminEmptyState
        title="لا توجد نتائج"
        description="غيّر كلمات البحث أو امسح المرشحات."
        action={<button>مسح المرشحات</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "لا توجد نتائج" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مسح المرشحات" })).toBeInTheDocument();
  });
});
