export type OwnerViewInput = {
  requested: boolean;
  requestedSlug: string;
  sessionSiteSlug: string | null;
};

export function shouldShowOwnerView({
  requested,
  requestedSlug,
  sessionSiteSlug
}: OwnerViewInput): boolean {
  return requested && sessionSiteSlug !== null && sessionSiteSlug === requestedSlug;
}
