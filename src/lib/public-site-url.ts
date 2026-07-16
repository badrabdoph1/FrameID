export function buildPublicSiteUrl(platformBaseUrl: string, slug: string): string {
  const normalizedBaseUrl = platformBaseUrl.replace(/\/$/u, "");
  return `${normalizedBaseUrl}/p/${slug}`;
}
