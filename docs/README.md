# FrameID Living Documentation

This directory is the maintained architectural reference for FrameID. It is part of the product, not an optional appendix.

## Mandatory reading order

1. `README.md`
2. `AI_DEVELOPMENT_RULES.md`
3. `PROJECT_CONVENTIONS.md`
4. `ARCHITECTURE_DECISIONS.md`
5. `PROJECT_ARCHITECTURE.md`
6. The domain document related to the task
7. `CHANGELOG.md`

## Documentation map

- `PROJECT_ARCHITECTURE.md` — current system boundaries, runtime layers, sources of truth, and dependency rules.
- `ARCHITECTURE_DECISIONS.md` — accepted architectural decisions and the reasons, alternatives, impact, and changeability behind them.
- `PROJECT_CONVENTIONS.md` — official implementation conventions, file placement, naming, services, repositories, actions, routes, media, data, and feature delivery rules.
- `DATA_FLOW.md` — current request, signup, publishing, media, billing, lifecycle, and template data flows.
- `DATABASE_ARCHITECTURE.md` — PostgreSQL/Prisma model groups, relations, soft deletion, and migration rules.
- `TEMPLATE_ARCHITECTURE.md` — current themes, templates, Template Content Source, runtime rendering, snapshots, and versioning.
- `TEMPLATE_SPECIFICATION.md` — required template contract and compatibility expectations.
- `CREATE_NEW_TEMPLATE.md` — supported procedure for adding a template without creating a second source of truth.
- `ADMIN_ARCHITECTURE.md` — admin boundaries, RBAC, auditability, and mutation rules.
- `BACKUP_ARCHITECTURE.md` — backup/restore types, jobs, storage expectations, and operational safeguards.
- `AUTHENTICATION.md` — customer and admin authentication, sessions, cookies, lifecycle synchronization, and password recovery.
- `AI_DEVELOPMENT_RULES.md` — binding delivery rules for humans and AI tools.
- `CHANGELOG.md` — append-only record of meaningful changes.

## Document ownership boundaries

Each document owns one responsibility:

- current architecture files explain **how the system currently works**;
- `ARCHITECTURE_DECISIONS.md` explains **why major architectural choices exist**;
- `PROJECT_CONVENTIONS.md` explains **how new code must be organized and delivered**;
- `CHANGELOG.md` explains **what changed over time**;
- `AI_DEVELOPMENT_RULES.md` defines **mandatory completion and governance rules**.

Do not duplicate full explanations across documents. Use links and concise references instead.

## Living-documentation rule

Any future change affecting Architecture, Database, Data Flow, Templates, Admin, Authentication, Backup, Storage, Images, Payments, Publishing, Lifecycle, Media, or any other material system area must update the related documents in the same commit.

A task is not complete when code alone changes, or when documentation no longer reflects the actual implementation.

## Code/documentation drift rule

The code is the executable source of truth. The documentation in this directory is the official and mandatory reference for understanding, maintaining, and governing that code.

When code and documentation differ:

1. inspect the code first;
2. identify the exact drift;
3. decide whether the code or documentation is wrong;
4. update the required side so they match again;
5. do not complete the task while the contradiction remains.

The documentation must never be treated as a substitute for inspecting the implementation before making changes.

## Current technical baseline

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma 6 with PostgreSQL
- Server Actions and server-only domain services
- Vitest and ESLint
- Node.js 20+

These documents must describe the current repository, not planned, removed, or assumed behavior.