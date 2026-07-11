# FrameID Living Documentation

This directory is the maintained architectural reference for FrameID. It is part of the product, not an optional appendix.

## Mandatory reading order

1. `AI_DEVELOPMENT_RULES.md`
2. `PROJECT_ARCHITECTURE.md`
3. The domain document related to the task
4. `CHANGELOG.md`

## Documentation map

- `PROJECT_ARCHITECTURE.md` — system boundaries, runtime layers, sources of truth, and dependency rules.
- `DATA_FLOW.md` — request, signup, publishing, media, billing, lifecycle, and template data flows.
- `DATABASE_ARCHITECTURE.md` — PostgreSQL/Prisma model groups, relations, soft deletion, and migration rules.
- `TEMPLATE_ARCHITECTURE.md` — themes, templates, starter content, runtime rendering, snapshots, and versioning.
- `TEMPLATE_SPECIFICATION.md` — required template contract and compatibility expectations.
- `CREATE_NEW_TEMPLATE.md` — supported procedure for adding a template without creating a second source of truth.
- `ADMIN_ARCHITECTURE.md` — admin boundaries, RBAC, auditability, and mutation rules.
- `BACKUP_ARCHITECTURE.md` — backup/restore types, jobs, storage expectations, and operational safeguards.
- `AUTHENTICATION.md` — customer and admin authentication, sessions, cookies, lifecycle synchronization, and password recovery.
- `AI_DEVELOPMENT_RULES.md` — binding rules for humans and AI tools.
- `CHANGELOG.md` — append-only record of meaningful changes.

## Living-documentation rule

A task is not complete when code alone changes. Any change to architecture, data flow, database, templates, admin, backup, authentication, deployment behavior, or cross-module contracts must update the relevant document in the same commit.

## Current technical baseline

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma 6 with PostgreSQL
- Server Actions and server-only domain services
- Vitest and ESLint
- Node.js 20+

The code remains the executable source of truth. These documents describe and govern that source of truth and must be corrected whenever they diverge.