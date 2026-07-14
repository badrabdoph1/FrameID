export function isImmersiveAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin/content/pages/");
}
