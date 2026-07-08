import type { ErrorDetail } from "./types";

function formatMaybeJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatErrorForClipboard(detail: ErrorDetail): string {
  const lines = [
    `=== FrameID Error Diagnostic ===`,
    `Error Code: ${detail.code}`,
    `Message: ${detail.message}`,
    `Route: ${detail.route ?? "N/A"}`,
    `Method: ${detail.method ?? "N/A"}`,
    `Timestamp: ${detail.timestamp}`,
    `Request ID: ${detail.requestId}`,
    `Correlation ID: ${detail.correlationId ?? "N/A"}`,
    `Browser: ${detail.browser ?? "N/A"}`,
    `Platform: ${detail.platform ?? "N/A"}`,
    `User Agent: ${detail.userAgent ?? "N/A"}`,
    `User ID: ${detail.userId ?? "N/A"}`,
    `Tenant ID: ${detail.tenantId ?? "N/A"}`,
    `Suggestion: ${detail.suggestion ?? "N/A"}`,
    ``,
  ];

  const metadata = formatMaybeJson(detail.metadata);
  if (metadata) {
    lines.push(`Metadata:`);
    lines.push(metadata);
    lines.push(``);
  }

  const isDev = process.env.NODE_ENV === "development";

  if (detail.cause && isDev) {
    lines.push(`Cause:`);
    lines.push(detail.cause);
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
