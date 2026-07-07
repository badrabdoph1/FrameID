"use client";

import { ClipboardCopy, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleCopy = async () => {
    if (!this.state.error) return;
    const text = `Error: ${this.state.error.message}\n\nStack:\n${this.state.error.stack}`;
    await navigator.clipboard.writeText(text);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === "development";

      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              حدث خطأ غير متوقع
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              تعذر تحميل هذا الجزء. حاول تحديث الصفحة.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 py-2 text-sm font-medium text-background transition",
                  "hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50",
                )}
              >
                <RotateCcw className="size-4" aria-hidden />
                إعادة المحاولة
              </button>
              <button
                onClick={this.handleCopy}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition",
                  "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50",
                )}
              >
                <ClipboardCopy className="size-4" aria-hidden />
                نسخ التفاصيل
              </button>
            </div>
            {isDev && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  تفاصيل تقنية
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius-control)] bg-ink/5 p-3 text-xs text-muted-foreground">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
