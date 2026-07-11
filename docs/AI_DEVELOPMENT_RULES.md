# AI Development Rules

This file is the binding development contract for every human developer and every AI tool working on FrameID.

## Before writing code

1. Read `docs/README.md`.
2. Read `PROJECT_ARCHITECTURE.md` and the domain document related to the task.
3. Inspect the current implementation and identify the existing source of truth.
4. Review `CHANGELOG.md` for recent architectural decisions.

## Mandatory rules

- Do not create a new source of truth when an existing model, service, registry, schema, or configuration already owns the data.
- Do not break the current architecture to deliver a local shortcut.
- Do not duplicate business logic across pages, actions, services, scripts, or tests.
- Preserve backward compatibility unless a breaking change is explicitly approved and documented.
- Keep database, runtime types, validation, rendering, and documentation aligned.
- Update documentation in the same commit as any architectural change.
- Update `CHANGELOG.md` for every meaningful feature, refactor, fix, migration, compatibility change, or operational change.
- Do not add a feature that affects system behavior without updating all related documents.
- Any change to data flow, database, templates, backup, admin, authentication, lifecycle, media, deployment, or publishing must be reflected directly in the relevant file under `docs/`.
- Documentation is part of the deliverable. A task is incomplete until the related documentation is updated.
- Reuse existing domain services and repositories before adding new abstractions.
- Keep server-only logic on the server. Do not expose secrets, raw session tokens, storage keys, internal IDs, or privileged operations to the client.
- Use the existing RBAC and permission guards for admin behavior. Do not authorize by UI visibility alone.
- Use Prisma schema and repositories as the persistence contract. Avoid direct ad-hoc SQL except approved migration or recovery scripts.
- Respect soft-delete fields and existing lifecycle rules.
- Do not mutate template contracts without considering existing sites, stored `templateCode`, `templateVersion`, snapshots, preview data, and starter content.
- Do not change backup or restore behavior without documenting recovery impact and validating failure modes.
- Do not silently change public URLs, publishing behavior, trial duration, or subscription lifecycle rules.
- Add or update tests for changed behavior. Tests must validate the current product contract, not obsolete UI text.

## Required documentation matrix

| Change area | Required documentation |
|---|---|
| Cross-module architecture | `PROJECT_ARCHITECTURE.md`, `DATA_FLOW.md` |
| Prisma models, relations, indexes, enums | `DATABASE_ARCHITECTURE.md`, `CHANGELOG.md` |
| Theme/template contract or rendering | `TEMPLATE_ARCHITECTURE.md`, `TEMPLATE_SPECIFICATION.md`, optionally `CREATE_NEW_TEMPLATE.md` |
| Admin centers, roles, permissions, audit | `ADMIN_ARCHITECTURE.md` |
| Backup, restore, storage, retention | `BACKUP_ARCHITECTURE.md` |
| Login, sessions, cookies, password reset | `AUTHENTICATION.md` |
| Any meaningful feature/fix/refactor | `CHANGELOG.md` |

## Completion checklist

A change may be marked complete only when:

- the existing source of truth was reused or intentionally evolved;
- affected compatibility paths were reviewed;
- tests and validation were updated;
- related documentation was updated in the same commit;
- `CHANGELOG.md` contains an entry when the change is meaningful;
- no contradictory or obsolete documentation remains.