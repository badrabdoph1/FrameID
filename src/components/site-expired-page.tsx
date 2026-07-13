import { ErrorExperience } from "@/components/errors/error-experience";

export function SiteExpiredPage() {
  return <ErrorExperience variant="expired" homeHref="/login" />;
}
