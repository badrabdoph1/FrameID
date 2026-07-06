const SUPER_ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "BILLING_MANAGER",
  "TEMPLATE_MANAGER",
  "SUPPORT_AGENT",
  "SECURITY_AUDITOR"
]);

export function canAccessSuperAdmin(role: string): boolean {
  return SUPER_ADMIN_ROLES.has(role);
}
