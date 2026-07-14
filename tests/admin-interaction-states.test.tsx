import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog";

type Row = { id: string; internalCode: string };

describe("admin interaction states", () => {
  it("uses a plain-language mobile label and a keyboard sorting button", () => {
    const columns: Column<Row>[] = [{ key: "internalCode", header: "الرمز الداخلي", mobileLabel: "الرمز", sortable: true }];
    render(<DataTable columns={columns} data={[{ id: "1", internalCode: "B" }]} keyField="id" />);
    expect(within(screen.getByRole("list", { name: "قائمة البيانات للموبايل" })).getByText("الرمز")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ترتيب حسب الرمز الداخلي" })).toBeInTheDocument();
  });

  it("exposes confirmation semantics and closes with Escape", () => {
    const onClose = vi.fn();
    render(<AdminConfirmDialog open title="حذف العميل" description="لن يمكن التراجع عن هذا الإجراء." onClose={onClose} onConfirm={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "حذف العميل" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "إغلاق نافذة التأكيد" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
