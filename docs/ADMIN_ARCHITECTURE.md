# Admin Architecture

## Purpose

The admin area operates the platform across customers, templates, billing, support, security, backups, and lifecycle controls. It is separate from the customer dashboard and must never rely on UI hiding as authorization.

## Roles

The Prisma `UserRole` enum currently includes:

- `SUPER_ADMIN`
- `OPERATIONS_ADMIN`
- `BILLING_MANAGER`
- `TEMPLATE_MANAGER`
- `SUPPORT_AGENT`
- `SECURITY_AUDITOR`
- `USER` for non-admin customers

Admin access is determined by the role/permission matrix in the admin permissions module. `admin-rbac.ts` exposes access helpers, while `admin-permission-guards.ts` enforces center/action permissions on the server.

## Authorization flow

1. Resolve the current admin session.
2. Redirect unauthenticated users to `/admin/login`.
3. Call `requireAdminPermission(center, action)` or `requireAdminCenter(center)`.
4. Verify role permission through the central RBAC source.
5. Only then read or mutate privileged data.

Client navigation, disabled buttons, and hidden components are usability features, not security controls.

## Admin centers

The current architecture groups capabilities into centers such as operations/customer management, templates/themes/content, billing/payments, support, security/audit, lifecycle/settings, and backup/recovery. The permission matrix is the source of truth for exact role access.

## Mutation rules

- Use Server Actions or server-only services.
- Require the correct center and action permission before reading sensitive targets or mutating.
- Scope target queries precisely and respect soft deletion.
- Validate state transitions, not just input shape.
- Create `AuditLog` entries for sensitive or support-relevant operations.
- Revalidate all affected admin, dashboard, and public routes.
- Never expose password hashes, raw tokens, storage keys, or secret configuration.

## Template administration

Template administration works with the existing theme/template registry and database records. It supports structured creation/editing, duplication, default restoration, preview, publish/unpublish, archive, order, and device image uploads. It must not create a separate JSON-only template system.

## Customer support and impersonation

Impersonation, when used, must be explicit, expiring, attributable to an admin, auditable, and limited by the dedicated impersonation models/services. It must not reuse or reveal the customer's raw session token.

## Auditability

Audit records should contain:

- action name;
- entity type and ID;
- actor where the relation is supported;
- target/context metadata;
- timestamps supplied by persistence.

Do not store secrets or unnecessary personal data in metadata.

## Adding an admin capability

1. Identify the existing center that owns the capability.
2. Extend the central permission definitions only if needed.
3. Add server-side guards to every read/mutation entry point.
4. Reuse domain services rather than placing business rules in admin pages.
5. Add audit behavior for sensitive mutations.
6. Add tests for permitted and forbidden roles.
7. Update this document and `CHANGELOG.md` in the same commit.