# FrameID Changelog

This is an append-only architectural and product change log. Never delete older entries; corrections must be added as new entries.

## Entry format

- Date
- Type: Feature, Fix, Refactor, Migration, Security, Operations, Documentation
- Affected files/modules
- Reason
- System impact
- Breaking changes
- Migration required
- Related documentation updated

---

## 2026-07-11 — Documentation/Architecture — Architecture decisions, conventions, and documentation review

- **Affected files:** `docs/ARCHITECTURE_DECISIONS.md`, `docs/PROJECT_CONVENTIONS.md`, `docs/README.md`, `docs/AI_DEVELOPMENT_RULES.md`, `docs/PROJECT_ARCHITECTURE.md`, `docs/TEMPLATE_ARCHITECTURE.md`, `docs/CHANGELOG.md`, plus consistency review of all files under `docs/`.
- **Reason:** record the rationale behind major architecture choices, establish one official implementation convention guide, strengthen code/documentation drift handling, and remove overlap between current-state documentation, decision rationale, conventions, and change history.
- **System impact:** every developer and AI tool now has a mandatory reading sequence, explicit source-of-truth boundaries, rules for services/repositories/actions/routes/media/data, and an ADR process for architectural decisions. Template switching and destructive content replacement boundaries are explicitly documented. Documentation ownership and same-commit maintenance rules are formalized.
- **Breaking changes:** No runtime breaking change. Development governance becomes stricter.
- **Migration required:** No.
- **Related documentation:** all affected documents updated in the same documentation change.

## 2026-07-11 — Documentation — Living documentation system

- **Affected files:** all files under `docs/`.
- **Reason:** make architecture documentation a maintained part of FrameID and establish mandatory rules for human and AI development.
- **System impact:** every future meaningful code change must review and update the relevant documentation in the same commit.
- **Breaking changes:** No.
- **Migration required:** No.
- **Related documentation:** all living-documentation files initialized.

## 2026-07-11 — Feature/Fix — Signup, publishing, template administration, and image upload hardening

- **Affected modules:** dashboard navigation, signup provisioning, platform URL resolution, admin template management, media upload validation, CI.
- **Reason:** ensure dashboard starts at the top, new sites are published with a valid production URL, trial duration follows admin lifecycle settings, templates are manageable without raw JSON, and images are uploaded from devices with server-side signature checks.
- **System impact:** improved onboarding, publishing reliability, template operations, and upload security.
- **Breaking changes:** No intended public breaking change.
- **Migration required:** No schema migration for these changes.
- **Related documentation:** architecture, data flow, templates, admin, authentication.