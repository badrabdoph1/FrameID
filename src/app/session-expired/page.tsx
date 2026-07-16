import type { Metadata } from "next";

import { SessionExpiredExperience } from "@/components/errors/session-expired-experience";

export const metadata: Metadata = {
  title: "انتهت الجلسة",
  robots: { index: false, follow: false },
};

export default function SessionExpiredPage() {
  return <SessionExpiredExperience homeHref="/" loginHref="/login" />;
}
