"use client";

import { useEffect, type ReactNode } from "react";

import { captureClientError, recordErrorAction } from "@/lib/client/error-reporting";

export function ErrorReportingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void captureClientError(event.error ?? new Error(event.message));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      void captureClientError(event.reason);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-error-action]") : null;
      const action = target?.dataset.errorAction;
      if (action) recordErrorAction(action);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return children;
}
