import { SiteUnavailableExperience } from "@/components/errors/site-unavailable-experience";

type Props = {
  isOwner?: boolean;
};

export function SiteExpiredPage({ isOwner = false }: Props) {
  return <SiteUnavailableExperience isOwner={isOwner} homeHref="/" loginHref="/login" dashboardHref="/dashboard" />;
}
