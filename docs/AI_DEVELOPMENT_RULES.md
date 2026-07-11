# AI Development Rules

This file is the binding development contract for every human developer and every AI tool working on FrameID.

## Before writing code

1. Read `docs/README.md`.
2. Read `PROJECT_CONVENTIONS.md` and `ARCHITECTURE_DECISIONS.md`.
3. Read `PROJECT_ARCHITECTURE.md` and the domain document related to the task.
4. Inspect the current implementation and identify the existing source of truth.
5. Review `CHANGELOG.md` for recent relevant changes.

## Mandatory rules

- Do not create a new source of truth when an existing model, service, registry, schema, configuration, or platform content source already owns the data.
- Do not break the current architecture to deliver a local shortcut.
- Do not duplicate business logic across pages, actions, routes, services, scripts, repositories, or tests.
- Preserve backward compatibility unless a breaking change is explicitly approved and documented.
- Keep database, runtime types, validation, rendering, and documentation aligned.
- Update documentation in the same commit as any architectural or material behavioral change.
- Update `CHANGELOG.md` for every meaningful feature, refactor, fix, migration, compatibility change, security change, or operational change.
- Do not add a feature that affects system behavior without updating all related documents.
- Any change to Architecture, Data Flow, Database, Templates, Admin, Authentication, Backup, Storage, Images, Payments, Publishing, Lifecycle, Media, Deployment, or another material system area must be reflected directly in the relevant file under `docs/`.
- Documentation is part of the deliverable. A task is incomplete until the related documentation is updated and matches the code.
- Reuse existing domain services and repositories before adding new abstractions.
- Keep server-only logic on the server. Do not expose secrets, raw session tokens, storage keys, internal IDs, or privileged operations to the client.
- Use the existing RBAC and permission guards for admin behavior. Do not authorize by UI visibility alone.
- Use Prisma schema and repositories as the persistence contract. Avoid direct ad-hoc SQL except approved migration or recovery scripts.
- Respect tenant scope, soft-delete fields, ownership, lifecycle status, and existing compatibility rules.
- Do not mutate template contracts without considering the Template Content Source, existing sites, stored `templateCode`, `templateVersion`, snapshots, preview data, starter content, and renderer compatibility.
- Do not change backup or restore behavior without documenting recovery impact and failure modes.
- Do not silently change public URLs, publishing behavior, trial duration, payment behavior, or subscription lifecycle rules.
- Add or update tests for changed behavior unless the task explicitly forbids running or modifying tests. Tests must validate the current product contract, not obsolete UI text.
- Add or update an ADR when a major architectural decision is introduced, replaced, or deliberately reversed.

## Code/documentation mismatch rule

Documentation must never be assumed correct automatically when it conflicts with the current code.

When any developer or AI tool finds a mismatch:

1. inspect the implementation first;
2. identify the exact file, behavior, contract, or flow that differs;
3. determine whether the implementation or the documentation is incorrect;
4. update the code or documentation so both represent one consistent system;
5. update related documents and `CHANGELOG.md` when the correction is meaningful;
6. do not mark the task complete until code and documentation are aligned again.

Do not silently preserve incorrect documentation, and do not silently change code merely to make outdated documentation appear correct.

## Required documentation matrix

| Change area | Required documentation |
|---|---|
| Cross-module architecture or ownership | `PROJECT_ARCHITECTURE.md`, `ARCHITECTURE_DECISIONS.md` when a decision changes, `DATA_FLOW.md` |
| Project structure or implementation convention | `PROJECT_CONVENTIONS.md` |
| Prisma models, relations, indexes, enums, migrations | `DATABASE_ARCHITECTURE.md`, `CHANGELOG.md` |
| Theme/template content, contract, switching, or rendering | `TEMPLATE_ARCHITECTURE.md`, `TEMPLATE_SPECIFICATION.md`, optionally `CREATE_NEW_TEMPLATE.md`, and ADR when ownership changes |
| Admin centers, roles, permissions, audit, impersonation | `ADMIN_ARCHITECTURE.md` |
| Backup, restore, storage, retention, disaster recovery | `BACKUP_ARCHITECTURE.md` |
| Login, sessions, cookies, password reset, authentication | `AUTHENTICATION.md` |
| Storage, image, or media pipeline | relevant architecture file, `PROJECT_CONVENTIONS.md` when the rule changes, `CHANGELOG.md` |
| Payments, publishing, lifecycle, or external integration | `DATA_FLOW.md`, related domain documentation, `CHANGELOG.md` |
| Any meaningful feature/fix/refactor | `CHANGELOG.md` |

## Completion checklist

A change may be marked complete only when:

- the mandatory documentation was read before implementation;
- the existing source of truth was reused or intentionally evolved;
- affected compatibility paths were reviewed;
- tenant, security, ownership, and permission boundaries remain correct;
- tests and validation were updated when applicable and not prohibited by the task;
- related documentation was updated in the same commit;
- `CHANGELOG.md` contains an entry when the change is meaningful;
- architectural decisions were recorded or superseded when required;
- no contradictory, duplicated, obsolete, or misleading documentation remains;
- the final documentation reflects the actual code.