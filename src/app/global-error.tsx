"use client";

import { GlobalErrorExperience } from "@/components/errors/global-error-experience";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>تحديث بسيط | FrameID</title>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        <GlobalErrorExperience error={error} />
      </body>
    </html>
  );
}
