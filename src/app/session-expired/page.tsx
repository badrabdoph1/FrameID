import type { Metadata } from "next";

import { ErrorExperience } from "@/components/errors/error-experience";

export const metadata: Metadata = {
  title: "انتهت الجلسة",
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return <ErrorExperience variant="session-expired" homeHref="/login" />;
}
