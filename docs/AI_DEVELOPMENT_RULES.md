# AI Development Rules

This file is the binding development contract for every human developer and every AI tool working on FrameID.

## Official Reference Model

- The repository code is the **Executable Source of Truth** because it represents the behavior that actually runs.
- The `docs/` directory is the **Official Knowledge Base** for understanding the system, its architecture, decisions, conventions, roadmap, feature boundaries, and delivery rules.
- Documentation must not be treated as a replacement for inspecting the implementation.

## Before Writing Code

1. Read [docs/README.md](README.md).
2. Read [PROJECT_CONVENTIONS.md](PROJECT_CONVENTIONS.md) and [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md).
3. Read [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md), the relevant domain document, and the relevant file under [docs/features/](features/README.md).
4. Review [ROADMAP.md](ROADMAP.md) before proposing or starting feature work.
5. Review [CHANGELOG.md](CHANGELOG.md) for recent relevant changes.
6. Inspect the current implementation and identify the existing owner of every affected rule and data set.

## Mandatory Rules

- Do not create a new source of truth when an existing model, service, registry, schema, configuration, or platform content source already owns the data.
- Do not break the current architecture to deliver a local shortcut.
- Do not duplicate business logic across pages, actions, routes, services, scripts, repositories, or tests.
- Do not create new documentation when an existing document can be updated.
- Do not repeat the same explanation across files. Every fact must have one primary official location; other files should link to it.
- Preserve backward compatibility unless a breaking change is explicitly approved and documented.
- Keep database, runtime types, validation, rendering, and documentation aligned.
- Reuse existing domain services and repositories before adding abstractions.
- Keep server-only logic on the server. Never expose secrets, raw session tokens, storage keys, internal privileged identifiers, or privileged operations to the client.
- Use existing RBAC and permission guards for admin behavior. UI visibility is not authorization.
- Use Prisma schema and approved repositories/services as the persistence contract. Avoid ad-hoc SQL except approved migration or recovery scripts.
- Respect tenant scope, ownership, soft deletion, lifecycle state, and compatibility rules.
- Do not mutate template contracts without considering the Template Content Source, existing sites, stored template code/version, snapshots, starter content, and renderer compatibility.
- Do not change backup or restore behavior without documenting recovery impact and failure modes.
- Do not silently change publishing, public URLs, trial duration, payment behavior, or subscription lifecycle rules.
- Add or update tests for changed behavior unless the task explicitly forbids running or modifying tests.
- Add or update an ADR when a major architectural decision is introduced, replaced, or reversed.

## Code and Documentation Mismatch Rule

Documentation must never be assumed correct automatically when it conflicts with current code.

When a mismatch is found:

1. inspect the implementation first;
2. identify the exact file, behavior, contract, or flow that differs;
3. determine whether the implementation or the documentation is incorrect;
4. update the incorrect side;
5. update every dependent document affected by the correction;
6. append to `CHANGELOG.md` when the correction is meaningful;
7. do not mark the task complete until code and documentation describe one consistent system.

Do not silently preserve incorrect documentation, and do not silently change code merely to make outdated documentation appear correct.

## Same-Commit Documentation Rule

Every new feature, refactor, material fix, migration, security change, operational change, or architectural change must update in the **same commit**:

- the related architecture or governance documentation;
- [CHANGELOG.md](CHANGELOG.md);
- [ROADMAP.md](ROADMAP.md) when the status of planned, in-progress, completed, or deprecated work changes;
- the related file under [docs/features/](features/README.md) when a major subsystem changes;
- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) when an architectural decision changes.

A task is incomplete if any required documentation update is missing or if the Official Knowledge Base no longer reflects the Executable Source of Truth.

## Required Documentation Matrix

| Change area | Required documentation |
|---|---|
| Cross-module architecture or ownership | `PROJECT_ARCHITECTURE.md`, `DATA_FLOW.md`, relevant ADR, `CHANGELOG.md` |
| Project structure or implementation convention | `PROJECT_CONVENTIONS.md`, `CHANGELOG.md` |
| Prisma models, relations, indexes, enums, migrations | `DATABASE_ARCHITECTURE.md`, relevant feature file, `CHANGELOG.md` |
| Theme/template content, switching, or rendering | `TEMPLATE_ARCHITECTURE.md`, `TEMPLATE_SPECIFICATION.md`, `features/templates.md`, optionally `CREATE_NEW_TEMPLATE.md`, ADR when ownership changes |
| Admin centers, roles, permissions, audit, impersonation | `ADMIN_ARCHITECTURE.md`, relevant feature file, `CHANGELOG.md` |
| Backup, restore, storage, retention, recovery | `BACKUP_ARCHITECTURE.md`, `features/backup-system.md`, `CHANGELOG.md` |
| Login, sessions, cookies, password reset | `AUTHENTICATION.md`, `features/authentication.md`, `CHANGELOG.md` |
| Storage, images, or media pipeline | `features/media.md`, related architecture/conventions, `CHANGELOG.md` |
| Billing or payments | `features/billing.md`, `DATA_FLOW.md` when flow changes, `CHANGELOG.md` |
| Subscriptions or lifecycle | `features/subscriptions.md`, `DATA_FLOW.md`, `CHANGELOG.md` |
| Notifications | `features/notifications.md`, relevant flow document, `CHANGELOG.md` |
| Customer-site provisioning, publishing, domains, content | `features/customer-sites.md`, related architecture/data-flow documents, `CHANGELOG.md` |
| PWA/offline/installability | `features/pwa.md`, `PROJECT_ARCHITECTURE.md`, `DATA_FLOW.md`, `ROADMAP.md`, `CHANGELOG.md` |
| Feature status changes | `ROADMAP.md` |
| Any meaningful feature/fix/refactor | `CHANGELOG.md` and the related feature/architecture documents |

## Completion Checklist

A change may be marked complete only when:

- mandatory documentation was read before implementation;
- the relevant implementation was inspected;
- the existing owner/source was reused or intentionally evolved;
- compatibility, tenant, security, ownership, and permission paths were reviewed;
- tests and validation were updated when applicable and not prohibited;
- related architecture and feature documentation was updated in the same commit;
- `CHANGELOG.md` was updated for meaningful changes;
- `ROADMAP.md` was updated when delivery status changed;
- ADRs were recorded or superseded when required;
- no contradictory, duplicated, obsolete, or misleading documentation remains;
- the Official Knowledge Base reflects the Executable Source of Truth.
