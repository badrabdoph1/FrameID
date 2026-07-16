import { render, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

import AdminErrorPage from "@/app/(admin)/admin/error";
import DashboardErrorPage from "@/app/(dashboard)/dashboard/error";
import MarketingErrorPage from "@/app/(marketing)/error";
import ErrorPage from "@/app/error";
import ForbiddenPage from "@/app/forbidden/page";
import GlobalErrorPage from "@/app/global-error";
import NotFoundPage from "@/app/not-found";
import SessionExpiredPage from "@/app/session-expired/page";
import UnauthorizedPage from "@/app/unauthorized/page";
import { SiteExpiredPage } from "@/components/site-expired-page";

const TECHNICAL_PHRASES = [
  "حدث خطأ غير متوقع",
  "حصل خطأ غير متوقع",
  "يوجد خطأ في النظام",
  "Internal Server Error",
  "Stack Trace",
  "Error Code",
  "كود الخطأ",
  "secret-digest",
  "private-stack",
];

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ occurrenceId: "occ-1" }), { status: 201 })),
  );
}

function expectNoTechnicalDetails(container: HTMLElement) {
  const text = container.textContent ?? "";
  for (const phrase of TECHNICAL_PHRASES) {
    expect(text).not.toContain(phrase);
  }
}

const testError = Object.assign(new Error("Internal Server Error private-stack"), {
  digest: "secret-digest",
});

describe("application error pages", () => {
  it("uses the platform error experience for the root error boundary", () => {
    stubFetch();
    const { container } = render(<ErrorPage error={testError} reset={() => undefined} />);

    expect(container).toHaveTextContent("نعمل على حل المشكلة");
    expect(within(container).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(container).getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();
    expect(within(container).getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");
    expectNoTechnicalDetails(container);
  });

  it("uses the low-dependency global error shell with Arabic document direction", () => {
    stubFetch();
    const element = GlobalErrorPage({ error: testError, reset: () => undefined }) as React.ReactElement<{
      dir: string;
      lang: string;
    }>;
    const { container } = render(element);

    expect(element.props.lang).toBe("ar");
    expect(element.props.dir).toBe("rtl");
    expect(container).toHaveTextContent("بنجهّز لك تجربة أحسن");
    expect(within(container).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(container).getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();
    expect(within(container).getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");
    expectNoTechnicalDetails(container);
  });

  it("uses dedicated error experiences for each route group", () => {
    stubFetch();
    const { container: marketing } = render(<MarketingErrorPage error={testError} reset={() => undefined} />);
    expect(marketing).toHaveTextContent("بنجهّز لك تجربة أحسن");
    expect(within(marketing).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(marketing).getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");

    const { container: dashboard } = render(<DashboardErrorPage error={testError} reset={() => undefined} />);
    expect(dashboard).toHaveTextContent("حدث خلل في لوحة التحكم");
    expect(within(dashboard).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(dashboard).getByRole("link", { name: "الرئيسية" })).toHaveAttribute("href", "/dashboard");
    expect(within(dashboard).getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();

    const { container: admin } = render(<AdminErrorPage error={testError} reset={() => undefined} />);
    expect(admin).toHaveTextContent("لوحة الإدارة تواجه مشكلة");
    expect(within(admin).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(admin).getByRole("link", { name: "الرئيسية" })).toHaveAttribute("href", "/admin");
    expect(within(admin).getByRole("button", { name: "إبلاغ الفريق التقني" })).toBeInTheDocument();
  });

  it("uses dedicated experiences for access and missing-page states", () => {
    const { container: notFound } = render(<NotFoundPage />);
    expect(notFound).toHaveTextContent("لم نعثر على هذه الصفحة");
    expect(within(notFound).getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");
    expect(within(notFound).queryByRole("button", { name: "إعادة المحاولة" })).not.toBeInTheDocument();
    expect(within(notFound).queryByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).not.toBeInTheDocument();

    const { container: unauthorized } = render(<UnauthorizedPage />);
    expect(unauthorized).toHaveTextContent("سجّل دخولك عشان تكمّل");
    expect(within(unauthorized).getByRole("link", { name: "تسجيل الدخول" })).toHaveAttribute("href", "/login");

    const { container: forbidden } = render(<ForbiddenPage />);
    expect(forbidden).toHaveTextContent("ليس لديك صلاحية للوصول");
    expect(within(forbidden).getByRole("link", { name: "تسجيل دخول بحساب آخر" })).toHaveAttribute("href", "/login");

    const { container: sessionExpired } = render(<SessionExpiredPage />);
    expect(sessionExpired).toHaveTextContent("جلسة الدخول انتهت");
    expect(sessionExpired).toHaveTextContent("بياناتك محفوظة");
    expect(within(sessionExpired).getByRole("link", { name: "تسجيل الدخول مرة أخرى" })).toHaveAttribute("href", "/login");
  });

  it("shows neutral messaging for visitors on the site-unavailable page", () => {
    const { container } = render(<SiteExpiredPage isOwner={false} />);
    const text = container.textContent ?? "";

    expect(container).toHaveTextContent("يتعذر عرض هذه الصفحة حاليًا");
    expect(container).toHaveTextContent("الموقع غير متاح مؤقتًا");
    expect(container).toHaveTextContent("إذا كنت صاحب الموقع");
    expect(within(container).getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(within(container).getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");
    expect(within(container).queryByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).not.toBeInTheDocument();
    for (const phrase of [
      "الاشتراك منتهي",
      "انتهت الفترة التجريبية",
      "الحساب موقوف",
      "لم يتم الدفع",
      "يلزم التجديد",
      "تحديث التفعيل",
    ]) {
      expect(text).not.toContain(phrase);
    }
  });

  it("shows a dashboard link for the site owner on the site-unavailable page", () => {
    const { container } = render(<SiteExpiredPage isOwner />);

    expect(container).toHaveTextContent("يتعذر عرض هذه الصفحة حاليًا");
    expect(within(container).getByRole("link", { name: /إدارة موقعك من لوحة التحكم/ })).toHaveAttribute("href", "/dashboard");
    const text = container.textContent ?? "";
    for (const phrase of [
      "الاشتراك منتهي",
      "انتهت الفترة التجريبية",
      "الحساب موقوف",
      "لم يتم الدفع",
      "يلزم التجديد",
    ]) {
      expect(text).not.toContain(phrase);
    }
  });

  it("never exposes internal details on any error page", () => {
    stubFetch();
    const pages: Array<{ name: string; element: React.ReactElement }> = [
      { name: "root", element: <ErrorPage error={testError} reset={() => undefined} /> },
      { name: "marketing", element: <MarketingErrorPage error={testError} reset={() => undefined} /> },
      { name: "dashboard", element: <DashboardErrorPage error={testError} reset={() => undefined} /> },
      { name: "admin", element: <AdminErrorPage error={testError} reset={() => undefined} /> },
      { name: "not-found", element: <NotFoundPage /> },
      { name: "unauthorized", element: <UnauthorizedPage /> },
      { name: "forbidden", element: <ForbiddenPage /> },
      { name: "session-expired", element: <SessionExpiredPage /> },
    ];

    for (const { element } of pages) {
      const { container } = render(element);
      expectNoTechnicalDetails(container);
    }
  });
});
