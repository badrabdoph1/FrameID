import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicLivingJourney } from "@/components/public-journey/public-living-journey";

function rect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 120,
    y: 300,
    width: 180,
    height: 48,
    top: 300,
    right: 300,
    bottom: 348,
    left: 120,
    toJSON: () => ({}),
    ...overrides,
  };
}

async function advanceToMessage(reduced = false) {
  await act(async () => vi.advanceTimersByTime(520));
  await act(async () => vi.advanceTimersByTime(reduced ? 120 : 620));
}

describe("PublicLivingJourney", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(async () => {
    await act(async () => vi.runOnlyPendingTimers());
    vi.useRealTimers();
  });

  it("wakes the source before generating a message from it", async () => {
    render(
      <>
        <a
          href="/templates"
          data-journey-source="home-start"
          ref={(node) => {
            if (node) node.getBoundingClientRect = () => rect();
          }}
        >
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );

    expect(screen.queryByRole("note")).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(520));
    expect(screen.getByRole("link", { name: "ابدأ" })).toHaveAttribute("data-journey-effect", "wake");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(680));
    expect(screen.getByRole("note")).toHaveTextContent("ابدأ من هنا");
  });

  it("removes the message first and leaves the source halo behind", async () => {
    render(
      <>
        <a href="/templates" data-journey-source="home-start">
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );
    await advanceToMessage();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "تمام" })));
    await act(async () => vi.advanceTimersByTime(240));

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ابدأ" })).toHaveAttribute("data-journey-effect", "linger");

    await act(async () => vi.advanceTimersByTime(1_050));
    expect(screen.getByRole("link", { name: "ابدأ" })).not.toHaveAttribute("data-journey-effect");
  });

  it("suppresses only this moment when the user explicitly asks", async () => {
    const view = render(
      <>
        <a href="/templates" data-journey-source="home-start">
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );
    await advanceToMessage();

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "ماتظهرش الرسالة دي تاني" }));
      fireEvent.click(screen.getByRole("button", { name: "تمام" }));
    });
    await act(async () => vi.advanceTimersByTime(1_400));
    view.unmount();

    render(
      <>
        <a href="/templates" data-journey-source="home-start">
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );
    await act(async () => vi.advanceTimersByTime(1_400));

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("uses one quiet idle reminder without creating another message", async () => {
    render(
      <>
        <a href="/templates" data-journey-source="home-start">
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );
    await advanceToMessage();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "تمام" })));
    await act(async () => vi.advanceTimersByTime(240));
    await act(async () => vi.advanceTimersByTime(1_050));
    await act(async () => vi.advanceTimersByTime(12_050));

    const source = screen.getByRole("link", { name: "ابدأ" });
    expect(source).toHaveAttribute("data-journey-effect", "idle");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(1_000));
    expect(source).not.toHaveAttribute("data-journey-effect");
  });

  it("uses the reduced-motion timing path", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <>
        <a href="/templates" data-journey-source="home-start">
          ابدأ
        </a>
        <PublicLivingJourney pathnameOverride="/" />
      </>,
    );
    await advanceToMessage(true);

    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("keeps preview guidance sequential and anchors the final step to the fixed CTA", async () => {
    render(
      <>
        <main data-journey-source="preview-screen">معاينة الموقع</main>
        <a href="/signup?template=noir-gold" data-journey-source="preview-use">
          استخدام هذا القالب
        </a>
        <PublicLivingJourney pathnameOverride="/templates/noir-gold/preview" />
      </>,
    );

    await advanceToMessage();
    expect(screen.getByRole("note")).toHaveTextContent("اتفرج عليه بعين عميلك");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "فهمت" })));
    await act(async () => vi.advanceTimersByTime(240));
    await act(async () => vi.advanceTimersByTime(1_050));
    await act(async () => vi.advanceTimersByTime(300));
    await advanceToMessage();

    const finalMessage = screen.getByRole("note");
    expect(finalMessage).toHaveTextContent("القالب جاهز يبقى موقعك");
    expect(finalMessage).toHaveStyle({ position: "fixed" });
  });

  it("rewards signup only after a valid form submission event", async () => {
    render(
      <>
        <form aria-label="signup-form">
          <input required aria-label="الاسم" />
          <div data-journey-source="signup-create">
            <button type="submit" data-journey-cta>
              إنشاء موقعي
            </button>
          </div>
        </form>
        <PublicLivingJourney pathnameOverride="/signup" />
      </>,
    );

    await advanceToMessage();
    const button = screen.getByRole("button", { name: "إنشاء موقعي" });
    await act(async () => fireEvent.click(button));
    expect(button).toHaveAttribute("data-journey-effect", "halo");

    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: "الاسم" }), { target: { value: "FrameID" } });
    });
    await act(async () => fireEvent.submit(screen.getByRole("form", { name: "signup-form" })));
    expect(button).toHaveAttribute("data-journey-effect", "reward");
  });
});
