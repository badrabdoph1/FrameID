export type CenterAction = "view" | "create" | "edit" | "delete";

export type Permission = {
  center: string;
  actions: CenterAction[];
};

export type RoleDefinition = {
  id: string;
  name: string;
  level: number;
  permissions: Permission[];
};

const ALL_ACTIONS: CenterAction[] = ["view", "create", "edit", "delete"];

export const ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: {
    id: "SUPER_ADMIN",
    name: "Super Admin",
    level: 100,
    permissions: [
      { center: "dashboard", actions: ALL_ACTIONS },
      { center: "customers", actions: ALL_ACTIONS },
      { center: "sites", actions: ALL_ACTIONS },
      { center: "templates", actions: ALL_ACTIONS },
      { center: "themes", actions: ALL_ACTIONS },
      { center: "content", actions: ALL_ACTIONS },
      { center: "media", actions: ALL_ACTIONS },
      { center: "marketing", actions: ALL_ACTIONS },
      { center: "seo", actions: ALL_ACTIONS },
      { center: "plans", actions: ALL_ACTIONS },
      { center: "subscriptions", actions: ALL_ACTIONS },
      { center: "deactivation-control", actions: ALL_ACTIONS },
      { center: "payments", actions: ALL_ACTIONS },
      { center: "notifications", actions: ALL_ACTIONS },
      { center: "messages", actions: ALL_ACTIONS },
      { center: "backups", actions: ALL_ACTIONS },
      { center: "platform", actions: ALL_ACTIONS },
      { center: "analytics", actions: ALL_ACTIONS },
      { center: "security", actions: ALL_ACTIONS },
      { center: "feature-flags", actions: ALL_ACTIONS },
      { center: "support", actions: ALL_ACTIONS },
      { center: "audit", actions: ALL_ACTIONS },
      { center: "settings", actions: ALL_ACTIONS },
      { center: "payment-settings", actions: ALL_ACTIONS },
    ],
  },
  OPERATIONS_ADMIN: {
    id: "OPERATIONS_ADMIN",
    name: "Operations Admin",
    level: 80,
    permissions: [
      { center: "dashboard", actions: ["view"] },
      { center: "customers", actions: ["view", "create", "edit"] },
      { center: "sites", actions: ["view", "edit"] },
      { center: "content", actions: ["view", "edit"] },
      { center: "deactivation-control", actions: ["view", "edit"] },
      { center: "messages", actions: ["view", "create", "edit"] },
      { center: "support", actions: ALL_ACTIONS },
      { center: "analytics", actions: ["view"] },
      { center: "audit", actions: ["view"] },
    ],
  },
  BILLING_MANAGER: {
    id: "BILLING_MANAGER",
    name: "Billing Manager",
    level: 60,
    permissions: [
      { center: "dashboard", actions: ["view"] },
      { center: "customers", actions: ["view"] },
      { center: "plans", actions: ["view", "create", "edit"] },
      { center: "payments", actions: ["view", "edit"] },
      { center: "payment-settings", actions: ["view", "edit"] },
      { center: "subscriptions", actions: ALL_ACTIONS },
      { center: "deactivation-control", actions: ["view", "edit"] },
      { center: "messages", actions: ["view", "create"] },
      { center: "analytics", actions: ["view"] },
    ],
  },
  TEMPLATE_MANAGER: {
    id: "TEMPLATE_MANAGER",
    name: "Template Manager",
    level: 60,
    permissions: [
      { center: "dashboard", actions: ["view"] },
      { center: "templates", actions: ALL_ACTIONS },
      { center: "themes", actions: ALL_ACTIONS },
      { center: "media", actions: ["view", "create", "edit"] },
    ],
  },
  SUPPORT_AGENT: {
    id: "SUPPORT_AGENT",
    name: "Support Agent",
    level: 40,
    permissions: [
      { center: "dashboard", actions: ["view"] },
      { center: "customers", actions: ["view"] },
      { center: "sites", actions: ["view"] },
      { center: "messages", actions: ["view", "create"] },
      { center: "support", actions: ["view", "edit"] },
    ],
  },
  SECURITY_AUDITOR: {
    id: "SECURITY_AUDITOR",
    name: "Security Auditor",
    level: 30,
    permissions: [
      { center: "dashboard", actions: ["view"] },
      { center: "security", actions: ["view"] },
      { center: "audit", actions: ["view"] },
      { center: "sessions", actions: ["view"] },
    ],
  },
};

export function hasPermission(
  role: string,
  center: string,
  action: CenterAction,
): boolean {
  const roleDef = ROLES[role];
  if (!roleDef) return false;
  if (role === "SUPER_ADMIN") return true;
  const perm = roleDef.permissions.find((p) => p.center === center);
  if (!perm) return false;
  return perm.actions.includes(action);
}

export function canAccessCenter(role: string, center: string): boolean {
  return hasPermission(role, center, "view");
}

export function getRoleLevel(role: string): number {
  return ROLES[role]?.level ?? 0;
}
