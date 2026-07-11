# Project Conventions

This file is the official implementation convention guide for every developer and AI tool working on FrameID. It defines where code belongs, how features are structured, and how architectural consistency is preserved.

## 1. Naming conventions

### Files and folders

- Use `kebab-case` for folders and non-component files.
- Use descriptive domain names, not generic names such as `helpers.ts`, `common.ts`, or `misc.ts`.
- React component files may use `kebab-case`; exported component names use `PascalCase`.
- Service files use the suffix `-service.ts`.
- Repository interfaces and implementations use `-repository.ts` and, when Prisma-specific, `prisma-<domain>-repository.ts`.
- Validation schemas use clear names such as `<feature>-schema.ts` or `<feature>-validation.ts`.
- Server Actions should use `actions.ts` or a domain-specific `*-actions.ts` file near the route that owns the form workflow.
- Route Handlers live only in `route.ts` files under `src/app/api/`.

### TypeScript symbols

- Components, classes, types, and interfaces: `PascalCase`.
- Functions, variables, and object properties: `camelCase`.
- Constants with true global/static meaning: `UPPER_SNAKE_CASE`.
- Boolean names should communicate state: `isPublished`, `hasAccess`, `canEdit`, `shouldRun`.
- Avoid abbreviations unless they are established project terms such as `RBAC`, `SEO`, or `URL`.

### Database

- Prisma models and enums use `PascalCase`.
- Prisma fields use `camelCase`.
- Relation names must be explicit when more than one relation exists between the same models.
- New enum values must preserve existing values unless a migration and compatibility plan explicitly replaces them.

## 2. Folder organization

### `src/app/`

Owns Next.js routes, layouts, pages, loading/error boundaries, Server Actions located near route workflows, and API Route Handlers.

It must not become the owner of reusable business rules.

### `src/components/`

Owns reusable presentation components and interaction-focused client components.

Components must receive prepared data or call approved actions. They must not directly create competing persistence or policy logic.

### `src/modules/`

Owns domain/application behavior. Each domain should group its services, repositories, policies, validation, adapters, and view-model builders together.

Examples include authentication, admin, templates/themes, lifecycle, media, payments, and backups.

### `src/lib/`

Owns narrow infrastructure utilities and shared clients such as Prisma initialization or platform URL resolution. Domain-specific policy does not belong here merely because it is reused.

### `prisma/`

Owns `schema.prisma`, migrations, and seed behavior. Schema evolution must remain compatible with deployed data or include an explicit migration plan.

### `scripts/` and `src/scripts/`

Own operational commands, compatibility checks, backup/restore entry points, and controlled maintenance workflows. Scripts should call shared services instead of reimplementing domain behavior.

### `tests/`

Owns product-contract and regression tests. Tests should assert current behavior and architecture, not stale wording or obsolete implementation details.

### `docs/`

Owns maintained architecture, conventions, decisions, specifications, operational design, and the append-only changelog.

## 3. When to create a Service

Create or extend a Service when behavior:

- represents a business rule or product policy;
- is reused by more than one route, action, script, or test;
- coordinates multiple repositories or side effects;
- must be independently testable;
- controls lifecycle, publishing, provisioning, permissions, compatibility, backup, restore, payment, or media behavior.

Do not create a Service solely to wrap one trivial function with no domain meaning.

A Service must not depend on React components or browser-only APIs.

## 4. When to create a Repository

Create a Repository when:

- a domain service needs persistence operations;
- Prisma details should be isolated from domain policy;
- the operation requires a stable persistence contract;
- tests benefit from an in-memory or fake implementation;
- queries are reused or require consistent tenant/deletion filtering.

Repositories own persistence translation, not business decisions or UI formatting.

Direct Prisma access may remain in narrowly scoped infrastructure code, but repeated or policy-sensitive access must be centralized.

## 5. When to use a Server Action

Use a Server Action for authenticated first-party UI mutations initiated by forms or dashboard/admin interactions when:

- the caller is the FrameID React application;
- progressive form handling or route revalidation is useful;
- no public/external API contract is required;
- authorization can be enforced on the server before calling the domain service.

Server Actions should:

1. validate input;
2. resolve the current user/admin;
3. enforce tenant scope or RBAC;
4. call a domain service or repository abstraction;
5. record audit data when required;
6. revalidate or redirect.

They must not trust hidden form fields for authorization or ownership.

## 6. When to use an API Route

Use an API Route when:

- an external system, webhook, cron service, or non-React client calls the application;
- a stable HTTP contract is required;
- file streaming/download or protocol-specific handling is needed;
- the operation is not naturally tied to a first-party Server Action.

API Routes must validate authentication, authorization, input, idempotency where applicable, and error responses. They should call the same domain services used by internal flows.

Do not create both an API Route and a Server Action with duplicated business logic.

## 7. Image and media rules

- User-facing image input must use device upload through the approved media pipeline.
- Do not ask users to type storage paths or internal URLs.
- Validate allowed MIME type, file size, and binary signature on the server.
- Generate unique sanitized storage keys.
- Keep binary storage separate from ownership and metadata records.
- PostgreSQL/Prisma stores media ownership, type, size, checksum/metadata, and safe public URL references.
- Never expose internal storage keys or privileged storage configuration to the client.
- Reuse the central upload service; do not create feature-specific unvalidated upload logic.
- Image replacement or deletion must respect references, tenant ownership, defaults, and soft-delete rules.

## 8. Data rules

- All customer data access must be tenant-scoped.
- Respect `deletedAt`, lifecycle status, publication status, and permission boundaries.
- Validate input before persistence.
- Use transactions when multiple writes must succeed or fail together.
- Do not persist derived values as a second source of truth unless there is a documented performance or audit reason and a synchronization rule.
- Preserve unknown compatible fields in structured JSON updates when required for backward compatibility.
- Do not expose secrets, password hashes, raw tokens, internal storage keys, or privileged operational metadata.
- Use explicit snapshots before destructive site-content replacement.

## 9. Source-of-truth rules

- Platform code, template contracts, platform defaults, migrations, documentation, and architecture decisions are versioned in Git.
- `prisma/schema.prisma` is the database-shape contract.
- PostgreSQL is authoritative for customer and operational data.
- The Template Content Source and registry are authoritative for platform template content and executable template compatibility.
- Database `Template` and `Theme` rows hold operational state and supported overrides; they must not invent unsupported renderer contracts.
- UI state, cached data, seed output, preview data, and client stores are projections, not independent sources of truth.
- Before adding storage or configuration, identify the existing owner and extend it rather than creating a parallel owner.

## 10. Creating a new Feature

Before implementation:

1. Read `docs/README.md`, `AI_DEVELOPMENT_RULES.md`, `PROJECT_CONVENTIONS.md`, `ARCHITECTURE_DECISIONS.md`, and the relevant domain document.
2. Inspect the current code and identify the actual source of truth.
3. Define affected domains, compatibility paths, permissions, data ownership, and documentation.
4. Reuse existing services, repositories, validation, upload, RBAC, and audit mechanisms.

During implementation:

- keep presentation, domain, and persistence responsibilities separate;
- avoid duplicated entry-point logic;
- preserve tenant and permission boundaries;
- design migrations and rollback where data changes;
- preserve existing URLs and persisted contracts unless explicitly approved.

Before completion:

- update affected documentation in the same commit;
- append `CHANGELOG.md` for meaningful work;
- add or update an ADR when an important architectural choice is introduced or changed;
- ensure no code/documentation contradiction remains.

## 11. Documentation rules

- Each document owns one concern. Link to another document instead of duplicating its full explanation.
- `README.md` owns navigation and reading order.
- `PROJECT_ARCHITECTURE.md` owns system boundaries and source ownership.
- `ARCHITECTURE_DECISIONS.md` owns why major choices were made.
- `PROJECT_CONVENTIONS.md` owns implementation rules and code organization.
- Domain architecture files own the current structure and flow of their domain.
- `CHANGELOG.md` records what changed; it does not replace architecture documentation.
- Documentation must describe current code, not planned or abandoned behavior, unless clearly marked as a proposal.
- When code and documentation differ, inspect the code first, identify the drift, and restore alignment before completing the task.
- Never delete historical changelog entries or silently rewrite accepted architectural decisions; supersede decisions explicitly.

## 12. Backward-compatibility rules

- Do not reuse stable codes, slugs, enum values, routes, or identifiers for incompatible behavior.
- Existing sites must continue to render after template evolution.
- Existing customer content must not be overwritten by template defaults.
- Breaking schema changes require migrations, deployment sequencing, recovery planning, and documentation.
- Removed behavior requires a deprecation and migration path when persisted data or public contracts depend on it.
- Additive changes are preferred over destructive changes.
- Compatibility adapters may be temporary, but their removal criteria must be documented.

## 13. Mandatory same-commit documentation rule

Any future change affecting Architecture, Database, Data Flow, Templates, Admin, Authentication, Backup, Storage, Images, Payments, Publishing, Lifecycle, Media, or another material system area must update the related documents in the same commit.

A task is not complete if the documentation no longer reflects the actual code.