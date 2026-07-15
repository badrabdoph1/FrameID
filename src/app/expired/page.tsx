import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { SiteExpiredPage } from "@/components/site-expired-page";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

export default async function ExpiredPage({ searchParams }: Props) {
  const { slug } = await searchParams;
  const session = await getCurrentRequestSession();
  const isOwner = slug ? session?.site.slug === slug : false;

  return <SiteExpiredPage isOwner={isOwner} />;
}
