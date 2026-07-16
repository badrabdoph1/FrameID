import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerOutreachWorkspace } from "@/app/(admin)/admin/messages/customer-outreach/customer-outreach-workspace";

const customers = [
  { id: "tenant-1", displayName: "استوديو سارة", ownerName: "سارة", ownerEmail: "sara@example.com", status: "ACTIVE", subscriptions: [{ status: "ACTIVE", planId: "pro" }] },
  { id: "tenant-2", displayName: "عدسة نور", ownerName: "نور", ownerEmail: "nour@example.com", status: "TRIAL", subscriptions: [{ status: "TRIAL", planId: null }] },
];

const campaigns = [
  {
    id: "campaign-1",
    title: "تحديث لوحة التحكم",
    body: "راجع الأدوات الجديدة داخل حسابك.",
    tone: "info",
    status: "ACTIVE",
    audienceMode: "EXPLICIT",
    createdByName: "المدير",
    createdAt: "2026-07-17T10:00:00.000Z",
    pausedAt: null,
    recipientCount: 2,
    recipients: customers.map((customer) => ({
      id: `recipient-${customer.id}`,
      tenantId: customer.id,
      tenantName: customer.displayName,
      ownerName: customer.ownerName,
      ownerEmail: customer.ownerEmail,
      tenantStatus: customer.status,
    })),
  },
  {
    id: "campaign-2",
    title: "حملة متوقفة",
    body: "لن تظهر حاليًا.",
    tone: "warning",
    status: "PAUSED",
    audienceMode: "ALL_MATCHING",
    createdByName: "المدير",
    createdAt: "2026-07-16T10:00:00.000Z",
    pausedAt: "2026-07-16T11:00:00.000Z",
    recipientCount: 1,
    recipients: [],
  },
];

function renderWorkspace() {
  return render(
    <CustomerOutreachWorkspace
      customers={customers}
      plans={[{ id: "pro", name: "احترافية" }]}
      campaigns={campaigns}
      stats={{ active: 1, paused: 1, recipients: 3 }}
      feedback={null}
      createAction={vi.fn()}
      statusAction={vi.fn()}
    />,
  );
}

describe("admin customer outreach workspace", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("composes a message and targets all matching customers or explicit selections", () => {
    const { container } = renderWorkspace();

    expect(screen.getByRole("heading", { name: "اكتب الرسالة" })).toBeInTheDocument();
    expect(screen.getByText("عميلان مطابقان")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("حالة العميل"), { target: { value: "ACTIVE" } });
    expect(screen.getByText("عميل واحد مطابق")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "اختيار عملاء محددين" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "اختيار استوديو سارة" }));
    expect(screen.getByText("عميل واحد محدد")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("حالة العميل"), { target: { value: "TRIAL" } });
    expect(container.querySelector('input[name="tenantIds"][value="tenant-1"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إرسال الرسالة الآن" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("عنوان الرسالة"), { target: { value: "تنبيه جديد" } });
    fireEvent.change(screen.getByLabelText("نص الرسالة"), { target: { value: "راجع حسابك." } });
    expect(screen.getByRole("button", { name: "إرسال الرسالة الآن" })).toBeEnabled();
  });

  it("filters campaign history and discloses real recipient identities", () => {
    renderWorkspace();

    fireEvent.change(screen.getByLabelText("حالة الحملات"), { target: { value: "ACTIVE" } });
    expect(screen.getByText("تحديث لوحة التحكم")).toBeInTheDocument();
    expect(screen.queryByText("حملة متوقفة")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "عرض مستلمي تحديث لوحة التحكم" }));
    const details = screen.getByRole("region", { name: "مستلمو تحديث لوحة التحكم" });
    expect(within(details).getByText("sara@example.com")).toBeInTheDocument();
    expect(within(details).getByText("nour@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إيقاف الحملة" })).toBeInTheDocument();
  });

  it("requires an explicit confirmation before sending to the resolved audience", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderWorkspace();
    fireEvent.change(screen.getByLabelText("عنوان الرسالة"), { target: { value: "تنبيه" } });
    fireEvent.change(screen.getByLabelText("نص الرسالة"), { target: { value: "راجع حسابك" } });

    const form = screen.getByRole("button", { name: "إرسال الرسالة الآن" }).closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("عميلين"));
    confirm.mockRestore();
  });
});
