import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardHomeClient } from "@/app/(dashboard)/dashboard/home-client";
import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const imageProps = { ...props };
    const alt = imageProps.alt ?? "";
    delete imageProps.alt;
    delete imageProps.fill;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imageProps} />;
  },
}));

function createViewModel(): DashboardViewModel & { showWelcome: boolean } {
  return {
    siteUrl: "https://frameid.app/p/ali",
    siteTitle: "Ali Studio",
    siteSlug: "ali",
    statusLabel: "منشور",
    percent: 100,
    isPublished: true,
    isReadyToPublish: true,
    lastModified: "اليوم",
    currentTheme: "كلاسك",
    photographerName: "Ali Studio",
    heroImageUrl: "https://example.com/cover.jpg",
    nextStepHref: "/dashboard/content",
    nextStepLabel: "عدل المحتوى",
    nextStepTitle: "استكمل موقعك",
    nextStepDescription: "أضف تفاصيلك",
    checklist: [],
    phases: [],
    operatingAlerts: [],
    stats: [],
    subscription: null,
    subscriptionExperience: null,
    customerMessages: [],
    showWelcome: false,
  };
}

describe("dashboard home client", () => {
  it("stacks the public site actions as full-width controls", () => {
    render(<DashboardHomeClient {...createViewModel()} />);

    expect(screen.getByRole("link", { name: /شاهد موقعك/ })).toHaveClass("w-full");
    expect(screen.getByRole("button", { name: "انسخ الرابط" })).toHaveClass("w-full");
  });
});
