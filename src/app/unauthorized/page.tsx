import type { Metadata } from "next";

import { ErrorExperience } from "@/components/errors/error-experience";

export const metadata: Metadata = {
  title: "تسجيل الدخول مطلوب",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return <ErrorExperience variant="unauthorized" homeHref="/login" />;
}
