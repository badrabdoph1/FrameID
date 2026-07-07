import { ROLES, hasPermission, canAccessCenter, type CenterAction } from "./permissions";

const SUPER_ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "BILLING_MANAGER",
  "TEMPLATE_MANAGER",
  "SUPPORT_AGENT",
  "SECURITY_AUDITOR",
]);

export function canAccessSuperAdmin(role: string): boolean {
  return SUPER_ADMIN_ROLES.has(role);
}

export function can(role: string, center: string, action: CenterAction): boolean {
  return hasPermission(role, center, action);
}

export function canView(role: string, center: string): boolean {
  return canAccessCenter(role, center);
}

export function getRoleLabel(role: string): string {
  return ROLES[role]?.name ?? role;
}
