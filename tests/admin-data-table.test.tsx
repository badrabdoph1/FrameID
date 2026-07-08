import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable, type Column } from "@/components/admin/shared/data-table";

type CustomerRow = {
  id: string;
  name: string;
  plan: string;
  status: string;
};

const columns: Column<CustomerRow>[] = [
  { key: "name", header: "العميل" },
  { key: "plan", header: "الباقة" },
  { key: "status", header: "الحالة" },
];

const rows: CustomerRow[] = [
  { id: "1", name: "Ali Studio", plan: "Pro", status: "نشط" },
];

describe("admin data table", () => {
  it("provides a mobile card list with readable field labels and actions", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        keyField="id"
        actions={(row) => <button type="button">فتح {row.name}</button>}
      />
    );

    const mobileList = screen.getByRole("list", { name: "قائمة البيانات للموبايل" });
    expect(mobileList).toHaveClass("md:hidden");

    const card = within(mobileList).getByRole("listitem", { name: "Ali Studio" });
    expect(within(card).getByText("العميل")).toBeInTheDocument();
    expect(within(card).getByText("Ali Studio")).toBeInTheDocument();
    expect(within(card).getByText("الباقة")).toBeInTheDocument();
    expect(within(card).getByText("Pro")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "فتح Ali Studio" })).toBeInTheDocument();
  });
});
