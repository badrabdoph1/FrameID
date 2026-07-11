"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorReportingProvider } from "@/components/errors/error-reporting-provider";

export function ToastRootProvider({ children }: { children: ReactNode }) {
  return <ErrorReportingProvider><ToastProvider>{children}</ToastProvider></ErrorReportingProvider>;
}
