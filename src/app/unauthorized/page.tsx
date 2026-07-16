import type { Metadata } from "next";

import { UnauthorizedErrorExperience } from "@/components/errors/unauthorized-error-experience";

export const metadata: Metadata = {
  title: "تسجيل الدخول مطلوب",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return <UnauthorizedErrorExperience homeHref="/" loginHref="/login" />;
}
