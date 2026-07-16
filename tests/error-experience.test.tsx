import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlatformErrorExperience } from "@/components/errors/platform-error-experience";
import { GlobalErrorExperience } from "@/components/errors/global-error-experience";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockReportingApi() {
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requests.push({ url, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
    if (url.endsWith("/capture")) {
      return new Response(JSON.stringify({ occurrenceId: "occ-1" }), { status: 201 });
    }
    return new Response(JSON.stringify({ issueId: "issue-1", issueNumber: "ISS-000042", merged: false }), { status: 201 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, requests };
}

describe("platform error experience", () => {
  it("keeps the same calm recovery actions when the root layout fails", () => {
    mockReportingApi();
    render(<GlobalErrorExperience error={Object.assign(new Error("private"), { digest: "hidden" })} onRetry={() => undefined} />);

    expect(screen.getByRole("heading", { name: "بنجهّز لك تجربة أحسن" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الصفحة الرئيسية" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();
    expect(screen.queryByText(/hidden|private/i)).not.toBeInTheDocument();
  });

  it("shows calm copy and the three required actions without technical details", async () => {
    mockReportingApi();
    render(<PlatformErrorExperience error={Object.assign(new Error("Internal Server Error"), { digest: "secret-digest" })} />);

    expect(screen.getByRole("heading", { name: "نعمل على حل المشكلة" })).toBeInTheDocument();
    expect(screen.getByText(/واجهتنا مشكلة غير متوقعة/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "الصفحة الرئيسية" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" })).toBeInTheDocument();
    expect(screen.queryByText(/secret-digest|Internal Server Error|Error Code|Stack Trace/i)).not.toBeInTheDocument();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("performs the supplied full-refresh action", () => {
    mockReportingApi();
    const retry = vi.fn();
    render(<PlatformErrorExperience error={new Error("failed")} onRetry={retry} />);

    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("reports with one click and does not require a customer note", async () => {
    const { requests } = mockReportingApi();
    render(<PlatformErrorExperience error={new Error("failed")} homeHref="/dashboard" />);
    await waitFor(() => expect(requests.some((request) => request.url.endsWith("/capture"))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" }));

    expect(await screen.findByText("تم إرسال البلاغ ISS-000042")).toBeInTheDocument();
    const report = requests.find((request) => request.url.endsWith("/report"));
    expect(report?.body).toEqual({ occurrenceId: "occ-1", customerNote: null });
  });

  it("sends an optional note only when the customer chooses to add it", async () => {
    const { requests } = mockReportingApi();
    render(<PlatformErrorExperience error={new Error("failed")} />);
    await waitFor(() => expect(requests.some((request) => request.url.endsWith("/capture"))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "إضافة ملاحظة اختيارية" }));
    fireEvent.change(screen.getByLabelText("ملاحظتك الاختيارية"), { target: { value: "ظهرت بعد الضغط على حفظ" } });
    fireEvent.click(screen.getByRole("button", { name: "إبلاغ الإدارة بالمشكلة" }));

    await screen.findByText("تم إرسال البلاغ ISS-000042");
    const report = requests.find((request) => request.url.endsWith("/report"));
    expect(report?.body).toEqual({ occurrenceId: "occ-1", customerNote: "ظهرت بعد الضغط على حفظ" });
  });
});
