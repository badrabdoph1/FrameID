import type { ErrorDetail } from "./types";

export function formatErrorForClipboard(detail: ErrorDetail): string {
  const lines = [
    `=== Error Details ===`,
    `Code: ${detail.code}`,
    `Message: ${detail.message}`,
    `Timestamp: ${detail.timestamp}`,
    `Request ID: ${detail.requestId}`,
    `Correlation ID: ${detail.correlationId ?? "N/A"}`,
    `Route: ${detail.route ?? "N/A"}`,
    `User ID: ${detail.userId ?? "N/A"}`,
    `Browser: ${detail.browser ?? "N/A"}`,
    `Platform: ${detail.platform ?? "N/A"}`,
    ``,
  ];

  if (detail.suggestion) {
    lines.push(`Suggestion: ${detail.suggestion}`);
    lines.push(``);
  }

  const isDev = process.env.NODE_ENV === "development";

  if (detail.cause && isDev) {
    lines.push(`Cause: ${detail.cause}`);
    lines.push(``);
  }

  if (detail.stack && isDev) {
    lines.push(`Stack:`);
    lines.push(detail.stack);
    lines.push(``);
  }

  lines.push(`---`);

  return lines.join("\n");
}
