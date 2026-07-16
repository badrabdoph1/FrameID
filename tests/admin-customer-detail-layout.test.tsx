import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomerQuickActions } from "@/app/(admin)/admin/customers/[id]/components/customer-quick-actions";
import { CustomerDetailClient } from "@/app/(admin)/admin/customers/[id]/customer-detail-client";
import type { CustomerDetail } from "@/modules/admin/customers/customer-types";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const customerActions = vi.hoisted(() => ({
  suspendCustomerAction: vi.fn(async () => undefined),
  activateCustomerAction: vi.fn(async () => undefined),
  archiveCustomerAction: vi.fn(async () => undefined),
  deleteCustomerAction: vi.fn(async () => undefined),
  resetCustomerPasswordAction: vi.fn(async () => undefined),
  extendCustomerTrialAction: vi.fn(async () => undefined),
  activateCustomerSubscriptionAction: vi.fn(async () => undefined),
  cancelCustomerSubscriptionAction: vi.fn(async () => undefined),
  editCustomerSubscriptionAction: vi.fn(async (formData: FormData) => {
    void formData;
  }),
  impersonateCustomerAction: vi.fn(async (formData: FormData) => {
    void formData;
  }),
  publishSiteAction: vi.fn(async () => undefined),
  suspendSiteAction: vi.fn(async () => undefined),
  revokeSessionAction: vi.fn(async () => undefined),
  createAdminNoteAction: vi.fn(async () => undefined),
  deleteAdminNoteAction: vi.fn(async () => undefined),
  sendNotificationAction: vi.fn(async (formData: FormData) => {
    void formData;
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/app/(admin)/admin/customers/actions", () => customerActions);

const platformBaseUrl = "https://id.frameid.uk";
const siteUrl = `${platformBaseUrl}/p/ahmed-studio`;

const customer: CustomerDetail = {
  id: "customer-1",
  displayName: "استوديو أحمد",
  owner: {
    id: "owner-1",
    name: "أحمد حسن",
    email: "ahmed@example.com",
    phone: "+201012345678",
    createdAt: "2026-07-01T10:00:00.000Z",
    emailVerifiedAt: "2026-07-01T10:05:00.000Z",
    role: "OWNER",
  },
  status: "TRIAL",
  trialStartedAt: "2026-07-01T10:00:00.000Z",
  trialEndsAt: "2026-07-30T10:00:00.000Z",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-16T10:00:00.000Z",
  deletedAt: null,
  sites: [
    {
      id: "site-1",
      slug: "ahmed-studio",
      title: "استوديو أحمد",
      description: "تصوير مناسبات",
      status: "PUBLISHED",
      themeName: "Noir Gold",
      themeCode: "noir-gold",
      templateName: "Noir Gold",
      domain: null,
      domains: [],
      isPublished: true,
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z",
      packagesCount: 2,
      albumsCount: 3,
      extrasCount: 1,
      seo: { title: "استوديو أحمد", description: "تصوير مناسبات" },
    },
  ],
  subscription: null,
  allSubscriptions: [],
  stats: {
    sitesCount: 1,
    paymentsCount: 2,
    mediaCount: 12,
    supportCasesCount: 1,
    auditLogsCount: 5,
    notificationsCount: 3,
    adminNotesCount: 2,
    totalRevenue: 4_850,
    totalStorageBytes: 1_024,
    totalVisits: 300,
    totalImages: 12,
    totalPackages: 2,
    totalOrders: 4,
  },
  recentPayments: [],
  recentActivity: [],
  sessions: [],
  supportCases: [],
};

const detailProps = {
  customer,
  platformBaseUrl,
  media: [],
  notifications: [],
  adminNotes: [],
  allSubscriptions: [],
  plans: [
    {
      id: "plan-pro",
      code: "pro",
      name: "الباقة الاحترافية",
      priceAmount: 1_200,
      currency: "EGP",
      billingInterval: "month",
      isActive: true,
    },
  ],
};

describe("customer detail layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups every existing customer action without mixing safe and sensitive actions", async () => {
    const onCopy = vi.fn();
    const onSecurity = vi.fn();

    render(
      <CustomerQuickActions
        customer={customer}
        siteUrl={siteUrl}
        onAction={vi.fn()}
        onCopy={onCopy}
        onNotify={vi.fn()}
        onEmail={vi.fn()}
        onSecurity={onSecurity}
        impersonateAction={customerActions.impersonateCustomerAction}
      />,
    );

    const center = screen.getByRole("region", { name: "مركز إجراءات العميل" });
    expect(within(center).getByText("الحساب والاشتراك")).toBeInTheDocument();
    expect(within(center).getByText("الموقع")).toBeInTheDocument();
    expect(within(center).getByText("التواصل")).toBeInTheDocument();
    expect(within(center).getByText("إجراءات حساسة")).toBeInTheDocument();

    expect(within(center).getByRole("button", { name: "تمديد التجربة" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "تفعيل" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "إيقاف" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "إعادة كلمة المرور" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "دخول لوحة تحكم العميل" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "إيقاف الموقع" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "إرسال إشعار" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "إرسال بريد" })).toBeInTheDocument();
    expect(within(center).getByRole("link", { name: "واتساب" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "أرشفة" })).toBeInTheDocument();
    expect(within(center).getByRole("button", { name: "حذف" })).toBeInTheDocument();

    expect(within(center).getByRole("link", { name: "فتح الموقع" })).toHaveAttribute("href", siteUrl);
    const copyButton = within(center).getByRole("button", { name: "نسخ الرابط" });
    fireEvent.click(copyButton);
    expect(onCopy).toHaveBeenCalledWith(siteUrl);

    fireEvent.click(within(center).getByRole("button", { name: "إعادة كلمة المرور" }));
    expect(onSecurity).toHaveBeenCalledTimes(1);

    fireEvent.click(within(center).getByRole("button", { name: "دخول لوحة تحكم العميل" }));
    await waitFor(() => expect(customerActions.impersonateCustomerAction).toHaveBeenCalledTimes(1));
    expect(customerActions.impersonateCustomerAction.mock.calls[0]![0].get("tenantId")).toBe("customer-1");
  });

  it("shows only one activation action for a suspended customer", () => {
    render(
      <CustomerQuickActions
        customer={{ ...customer, status: "SUSPENDED" }}
        siteUrl={siteUrl}
        onAction={vi.fn()}
        onCopy={vi.fn()}
        onNotify={vi.fn()}
        onEmail={vi.fn()}
        onSecurity={vi.fn()}
        impersonateAction={customerActions.impersonateCustomerAction}
      />,
    );

    const center = screen.getByRole("region", { name: "مركز إجراءات العميل" });
    expect(within(center).getByRole("button", { name: "تشغيل" })).toBeInTheDocument();
    expect(within(center).queryByRole("button", { name: "تفعيل" })).not.toBeInTheDocument();
  });

  it("combines the old eight tabs into four compact workspaces", () => {
    const overview = render(<CustomerDetailClient initialTab="overview" {...detailProps} />);
    expect(screen.getByRole("region", { name: "مساحة الملخص والإجراءات" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "مركز إجراءات العميل" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "بيانات تسجيل الدخول" })).not.toBeInTheDocument();
    overview.unmount();

    const site = render(
      <CustomerDetailClient
        initialTab="site"
        {...detailProps}
        media={[
          {
            id: "asset-1",
            url: "https://example.com/preview.jpg",
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            width: 800,
            height: 600,
            alt: "صورة تجريبية",
            createdAt: "2026-07-16T10:00:00.000Z",
          },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "مساحة الموقع والملفات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "إدارة الموقع والملفات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الوسائط والملفات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "استوديو أحمد" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "البحث في ملفات العميل" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تنزيل صورة تجريبية" })).toHaveAttribute("href", "https://example.com/preview.jpg");
    expect(screen.getByRole("link", { name: "تنزيل صورة تجريبية" })).toHaveClass("size-11");
    expect(screen.getByRole("link", { name: "فتح الموقع" })).toHaveAttribute("href", siteUrl);
    expect(screen.getByRole("link", { name: "فتح الموقع" })).toHaveClass("min-h-11");
    expect(screen.getByText(siteUrl)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إيقاف" })).toHaveClass("min-h-11");
    site.unmount();

    const billing = render(<CustomerDetailClient initialTab="billing" {...detailProps} />);
    expect(screen.getByRole("region", { name: "مساحة الاشتراك والمدفوعات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "إدارة الاشتراك والمدفوعات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "سجل المدفوعات" })).toBeInTheDocument();
    billing.unmount();

    render(<CustomerDetailClient initialTab="support" {...detailProps} />);
    expect(screen.getByRole("region", { name: "مساحة الدعم والحماية" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الدخول والحماية" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "التواصل والمتابعة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "بيانات تسجيل الدخول" })).toBeInTheDocument();
  });

  it("creates a paid subscription from the customer billing workspace", async () => {
    render(<CustomerDetailClient initialTab="billing" {...detailProps} />);

    fireEvent.click(screen.getByRole("button", { name: "إنشاء اشتراك" }));
    expect(screen.getByLabelText("الباقة")).toHaveValue("plan-pro");
    expect(screen.getByLabelText("حالة الاشتراك")).toHaveValue("ACTIVE");

    fireEvent.click(screen.getByRole("checkbox", { name: /تسجيل دفعة معتمدة/ }));
    expect(screen.getByLabelText("حالة الاشتراك")).toHaveValue("ACTIVE");
    expect(screen.getByLabelText("المبلغ (EGP)")).toHaveValue(1200);
    fireEvent.change(screen.getByLabelText(/رقم المرجع/), { target: { value: "manual-42" } });
    fireEvent.click(screen.getByRole("button", { name: "مراجعة وحفظ" }));

    expect(screen.getByRole("dialog", { name: "إنشاء اشتراك للعميل" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "حفظ الاشتراك" }));

    await waitFor(() => expect(customerActions.editCustomerSubscriptionAction).toHaveBeenCalledTimes(1));
    const formData = customerActions.editCustomerSubscriptionAction.mock.calls[0]![0];
    expect(formData.get("planId")).toBe("plan-pro");
    expect(formData.get("status")).toBe("ACTIVE");
    expect(formData.get("recordPayment")).toBe("true");
    expect(formData.get("paymentAmount")).toBe("1200");
    expect(formData.get("paymentReference")).toBe("manual-42");
  });

  it("switches a trial subscription to active when recording a real payment", () => {
    const trialSubscription = {
      id: "subscription-trial",
      planId: null,
      status: "TRIAL" as const,
      planName: null,
      planPrice: null,
      planCode: null,
      currentPeriodStart: "2026-07-01T10:00:00.000Z",
      currentPeriodEnd: "2026-07-30T10:00:00.000Z",
      expiresAt: "2026-07-30T10:00:00.000Z",
      createdAt: "2026-07-01T10:00:00.000Z",
    };
    render(
      <CustomerDetailClient
        initialTab="billing"
        {...detailProps}
        customer={{ ...customer, subscription: trialSubscription, allSubscriptions: [trialSubscription] }}
        allSubscriptions={[trialSubscription]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "تعديل الاشتراك" }));
    expect(screen.getByLabelText("حالة الاشتراك")).toHaveValue("TRIAL");
    fireEvent.click(screen.getByRole("checkbox", { name: /تسجيل دفعة معتمدة/ }));
    expect(screen.getByLabelText("حالة الاشتراك")).toHaveValue("ACTIVE");
  });

  it("lets workspace links own URL navigation without a duplicate router replacement", () => {
    render(<CustomerDetailClient initialTab="overview" {...detailProps} />);

    fireEvent.click(screen.getByRole("link", { name: "الاشتراك والمدفوعات" }));

    expect(screen.getByRole("heading", { name: "إدارة الاشتراك والمدفوعات" })).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("synchronizes the visible workspace when server URL state changes", () => {
    const view = render(<CustomerDetailClient initialTab="overview" {...detailProps} />);
    expect(screen.getByRole("region", { name: "مركز إجراءات العميل" })).toBeInTheDocument();

    view.rerender(<CustomerDetailClient initialTab="billing" {...detailProps} />);

    expect(screen.getByRole("heading", { name: "إدارة الاشتراك والمدفوعات" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "مركز إجراءات العميل" })).not.toBeInTheDocument();
  });

  it("sends the notification type using the server action contract", async () => {
    render(<CustomerDetailClient initialTab="support" {...detailProps} />);

    fireEvent.change(screen.getByRole("combobox", { name: "نوع الإشعار" }), { target: { value: "warning" } });
    fireEvent.change(screen.getByRole("textbox", { name: "عنوان الإشعار" }), { target: { value: "تنبيه مهم" } });
    fireEvent.change(screen.getByRole("textbox", { name: "محتوى الإشعار" }), { target: { value: "راجع اشتراكك" } });
    fireEvent.click(screen.getByRole("button", { name: "إرسال" }));

    await waitFor(() => expect(customerActions.sendNotificationAction).toHaveBeenCalledTimes(1));
    const formData = customerActions.sendNotificationAction.mock.calls[0][0] as FormData;
    expect(formData.get("notificationType")).toBe("warning");
    expect(formData.get("type")).toBeNull();
    expect(formData.get("title")).toBe("تنبيه مهم");
    expect(formData.get("body")).toBe("راجع اشتراكك");
  });

  it("keeps the user in place and explains when copying the site link fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CustomerDetailClient initialTab="overview" {...detailProps} />);
    fireEvent.click(screen.getByRole("button", { name: "نسخ الرابط" }));

    expect(writeText).toHaveBeenCalledWith(siteUrl);
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("تعذر نسخ رابط الموقع");
    });
  });

  it("uses password-specific feedback when copying a generated password", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<CustomerDetailClient initialTab="support" {...detailProps} />);
    fireEvent.click(screen.getByRole("button", { name: "إنشاء باسورد جديد" }));
    fireEvent.click(screen.getByRole("button", { name: "نسخ" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status")).toHaveTextContent("تم نسخ كلمة المرور");
  });

  it("names the failed action instead of showing a generic error", async () => {
    customerActions.sendNotificationAction.mockRejectedValueOnce(new Error("delivery failed"));
    render(<CustomerDetailClient initialTab="support" {...detailProps} />);

    const titleField = screen.getByRole("textbox", { name: "عنوان الإشعار" });
    const bodyField = screen.getByRole("textbox", { name: "محتوى الإشعار" });
    fireEvent.change(titleField, { target: { value: "رسالة" } });
    fireEvent.change(bodyField, { target: { value: "محتوى الرسالة" } });
    fireEvent.click(screen.getByRole("button", { name: "إرسال" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("تعذر إرسال الإشعار");
    });
    expect(titleField).toHaveValue("رسالة");
    expect(bodyField).toHaveValue("محتوى الرسالة");
  });

  it("confirms note deletion before calling the destructive action", async () => {
    render(
      <CustomerDetailClient
        initialTab="support"
        {...detailProps}
        adminNotes={[{ id: "note-1", body: "ملاحظة مهمة", authorName: "المشرف", createdAt: "2026-07-16T10:00:00.000Z" }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "حذف" }));

    expect(screen.getByRole("dialog", { name: "حذف الملاحظة" })).toBeInTheDocument();
    expect(customerActions.deleteAdminNoteAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "حذف الملاحظة" }));
    await waitFor(() => expect(customerActions.deleteAdminNoteAction).toHaveBeenCalledTimes(1));
  });

  it("confirms a password change before saving it", async () => {
    render(<CustomerDetailClient initialTab="support" {...detailProps} />);

    fireEvent.click(screen.getByRole("button", { name: "كتابة باسورد مخصص" }));
    fireEvent.change(screen.getByLabelText("كلمة المرور الجديدة"), {
      target: { value: "SecurePreview123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ الباسورد" }));

    expect(screen.getByRole("dialog", { name: "تأكيد تغيير كلمة المرور" })).toBeInTheDocument();
    expect(customerActions.resetCustomerPasswordAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "تغيير كلمة المرور" }));
    await waitFor(() => expect(customerActions.resetCustomerPasswordAction).toHaveBeenCalledTimes(1));
  });

  it("keeps the payment table available through a labelled horizontal scroll region", () => {
    render(
      <CustomerDetailClient
        initialTab="billing"
        {...detailProps}
        customer={{
          ...customer,
          recentPayments: [
            {
              id: "payment-1",
              method: "bank_transfer",
              amount: 1200,
              currency: "EGP",
              status: "APPROVED",
              reference: "REF-1200",
              proofUrl: "https://example.com/proof.jpg",
              reviewedByName: "المشرف",
              note: null,
              createdAt: "2026-07-15T10:00:00.000Z",
              reviewedAt: "2026-07-15T11:00:00.000Z",
            },
          ],
        }}
      />,
    );

    const paymentRegion = screen.getByRole("region", { name: "سجل المدفوعات القابل للتمرير" });
    expect(paymentRegion).toHaveClass("overflow-x-auto");
    expect(paymentRegion).toHaveAttribute("tabindex", "0");
    expect(within(paymentRegion).getByRole("table")).toBeInTheDocument();
    expect(within(paymentRegion).getByText("REF-1200")).toBeInTheDocument();
  });
});
