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
import ExpiredPage from "@/app/expired/page";

const CALM_MESSAGE = "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات";
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

function expectSharedRecoveryUi(container: HTMLElement, homeHref: string) {
  const scope = within(container);
  expect(scope.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
  expect(scope.getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();
  expect(scope.getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", homeHref);
  expect(container).toHaveTextContent(CALM_MESSAGE);
  const text = container.textContent ?? "";
  for (const phrase of TECHNICAL_PHRASES) {
    expect(text).not.toContain(phrase);
  }
}

const testError = Object.assign(new Error("Internal Server Error private-stack"), {
  digest: "secret-digest",
});

describe("application error pages", () => {
  it("uses the unified experience for the root error boundary", () => {
    stubFetch();
    const { container } = render(<ErrorPage error={testError} reset={() => undefined} />);

    expectSharedRecoveryUi(container, "/");
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
    expectSharedRecoveryUi(container, "/");
  });

  it("uses the unified experience for route group errors", () => {
    stubFetch();
    const { container: marketing } = render(<MarketingErrorPage error={testError} reset={() => undefined} />);
    expectSharedRecoveryUi(marketing, "/");

    const { container: dashboard } = render(<DashboardErrorPage error={testError} reset={() => undefined} />);
    expectSharedRecoveryUi(dashboard, "/dashboard");

    const { container: admin } = render(<AdminErrorPage error={testError} reset={() => undefined} />);
    expectSharedRecoveryUi(admin, "/admin");
  });

  it("uses the unified experience for access and missing-page states", () => {
    stubFetch();
    const { container: notFound } = render(<NotFoundPage />);
    expectSharedRecoveryUi(notFound, "/");

    const { container: unauthorized } = render(<UnauthorizedPage />);
    expectSharedRecoveryUi(unauthorized, "/login");

    const { container: forbidden } = render(<ForbiddenPage />);
    expectSharedRecoveryUi(forbidden, "/");

    const { container: sessionExpired } = render(<SessionExpiredPage />);
    expectSharedRecoveryUi(sessionExpired, "/login");
  });

  it("keeps the expired-site page calm and reportable", () => {
    stubFetch();
    const { container } = render(<ExpiredPage />);

    expectSharedRecoveryUi(container, "/login");
  });
});
