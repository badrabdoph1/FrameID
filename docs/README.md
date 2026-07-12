# FrameID Living Documentation

معمارية النسخ المغلقة موثقة في `BACKUP_ARCHITECTURE.md`، ومسار فقد Railway الكامل في `DISASTER_RECOVERY.md`، وقرار المصدر الوحيد في `ARCHITECTURE_DECISIONS.md`.

This directory is the **Official Knowledge Base** for FrameID. It is part of the product and the delivery process, not an optional appendix.

The repository code is the **Executable Source of Truth** because it represents the behavior that actually runs. The documentation explains that implementation, records its architecture and decisions, and defines the rules for changing it safely.

## Mandatory Reading Order

Every developer and AI tool must read, in order, before writing code:

1. [README.md](README.md)
2. [AI_DEVELOPMENT_RULES.md](AI_DEVELOPMENT_RULES.md)
3. [PROJECT_CONVENTIONS.md](PROJECT_CONVENTIONS.md)
4. [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md)
5. [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
6. The architecture and [feature document](features/README.md) related to the task
7. [ROADMAP.md](ROADMAP.md)
8. [CHANGELOG.md](CHANGELOG.md)

The implementation files affected by the task must then be inspected before any code is changed.

## Documentation Map

### Governance and orientation

- [AI_DEVELOPMENT_RULES.md](AI_DEVELOPMENT_RULES.md) — mandatory delivery and completion rules for humans and AI tools.
- [PROJECT_CONVENTIONS.md](PROJECT_CONVENTIONS.md) — official implementation, naming, placement, service, repository, action, route, media, and data conventions.
- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) — accepted architectural decisions, rationale, rejected alternatives, impact, and changeability.
- [ROADMAP.md](ROADMAP.md) — planned, in-progress, completed, and deprecated project work.
- [CHANGELOG.md](CHANGELOG.md) — append-only history of meaningful changes.

### Core architecture

- [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md) — current boundaries, runtime layers, ownership, and dependency rules.
- [DATA_FLOW.md](DATA_FLOW.md) — current request, signup, publishing, media, billing, lifecycle, and template flows.
- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) — PostgreSQL/Prisma models, relations, deletion, indexes, and migration rules.
- [TEMPLATE_ARCHITECTURE.md](TEMPLATE_ARCHITECTURE.md) — template content ownership, registry, rendering, switching, snapshots, and versioning.
- [TEMPLATE_SPECIFICATION.md](TEMPLATE_SPECIFICATION.md) — required template contract and compatibility expectations.
- [CREATE_NEW_TEMPLATE.md](CREATE_NEW_TEMPLATE.md) — supported procedure for adding a template.
- [ADMIN_ARCHITECTURE.md](ADMIN_ARCHITECTURE.md) — admin boundaries, RBAC, auditability, and mutation rules.
- [BACKUP_ARCHITECTURE.md](BACKUP_ARCHITECTURE.md) — backup, restore, storage, retention, and recovery safeguards.
- [AUTHENTICATION.md](AUTHENTICATION.md) — customer/admin authentication, sessions, cookies, and password recovery.

### Feature documentation

Focused subsystem documentation lives in [docs/features/](features/README.md):

- [Backup system](features/backup-system.md)
- [Templates](features/templates.md)
- [Billing](features/billing.md)
- [Subscriptions](features/subscriptions.md)
- [Authentication](features/authentication.md)
- [Notifications](features/notifications.md)
- [PWA](features/pwa.md)
- [Media](features/media.md)
- [Customer sites](features/customer-sites.md)

## Document Ownership Boundaries

Every piece of information must have one primary official location:

- core architecture documents explain **how the current system works across boundaries**;
- feature documents explain **one major subsystem in focused operational detail**;
- `ARCHITECTURE_DECISIONS.md` explains **why major choices exist**;
- `PROJECT_CONVENTIONS.md` explains **how code must be organized and delivered**;
- `ROADMAP.md` explains **the current delivery status**;
- `CHANGELOG.md` explains **what changed over time**;
- `AI_DEVELOPMENT_RULES.md` defines **mandatory governance and completion rules**.

Do not repeat full explanations. Link to the primary document and include only the context required by the current file.

Do not create a new documentation file when an existing document can own the information. A new document is justified only for a distinct major subsystem, architectural decision category, or governance responsibility.

## Authority and Drift Rule

- Code is the **Executable Source of Truth**.
- Documentation is the **Official Knowledge Base** for understanding, maintaining, and governing the project.
- Documentation must not be called the source of truth for runtime behavior.

When code and documentation differ:

1. inspect the code first;
2. identify the exact disagreement;
3. determine whether the code or documentation is incorrect;
4. update the incorrect side;
5. update every related document so one consistent system remains;
6. do not complete the task while the disagreement exists.

## Same-Commit Maintenance Rule

Every new feature, refactor, fix with material behavior, or architectural change must update in the **same commit**:

- the related architecture or governance documentation;
- [CHANGELOG.md](CHANGELOG.md);
- [ROADMAP.md](ROADMAP.md) when project status changes;
- the related file under [docs/features/](features/README.md) when a major subsystem changes;
- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) when a decision is introduced, replaced, or reversed.

A task is incomplete when code changes without the required documentation, or when the Official Knowledge Base no longer reflects the executable implementation.

## Current Technical Baseline

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma 6 with PostgreSQL
- Server Actions and server-only domain services
- Vitest and ESLint
- Node.js 20+

Only current implemented behavior belongs in architecture and feature documents. Future approved work belongs in `ROADMAP.md`; removed or replaced behavior belongs in its `Deprecated` section and the changelog.
