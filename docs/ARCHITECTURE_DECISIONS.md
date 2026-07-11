# Architecture Decisions

This file is the official Architecture Decision Record for FrameID. It documents why important architectural choices exist. It does not replace the domain documentation or executable code.

## Decision format

Every decision records:

- **Decision** — the selected architectural rule.
- **Reason** — why it was selected.
- **Rejected alternatives** — approaches intentionally not used.
- **System impact** — practical consequences.
- **Future changeability** — whether and how the decision may evolve.

---

## ADR-001 — Template Content Source is the single source of truth for platform template content

**Decision:** Platform-owned template content, starter content, supported sections, default configuration, and renderer contract are defined in the code-based Template Content Source under the theme/template definitions and registry. Admin database records may control operational metadata and approved overrides, but must not create an independent template contract.

**Reason:** Templates must be versioned, reviewable, deployable, testable, and compatible with renderers. Keeping the canonical contract in Git prevents hidden production-only template definitions.

**Rejected alternatives:**

- Treating database JSON as the complete template contract.
- Copying template definitions into multiple admin forms or client components.
- Maintaining separate template files outside the registry.

**System impact:** Template contract changes require code review, version consideration, compatibility review, documentation updates, and deployment. Admin tools must map to the supported contract.

**Future changeability:** Changeable only through an explicit architectural migration that preserves existing sites and defines a replacement single source of truth.

## ADR-002 — Platform data and customer data are separate concerns

**Decision:** Platform-owned definitions and defaults are separated from tenant-owned customer content and operational state.

**Reason:** Platform releases must remain deterministic while customer changes must persist independently and remain tenant-scoped.

**Rejected alternatives:**

- Storing customer edits inside platform template files.
- Treating seeded defaults as live customer content.
- Using one unscoped data structure for platform and tenant data.

**System impact:** Platform definitions live in Git; customer content is materialized into tenant-scoped PostgreSQL records. Database queries and mutations must preserve tenant boundaries.

**Future changeability:** The implementation can evolve, but the ownership separation is a permanent system invariant unless a full multi-tenancy redesign is approved.

## ADR-003 — Git is the official source for platform content and architectural history

**Decision:** Git is the official source for platform-owned template definitions, default content, application code, migrations, documentation, and architectural decision history.

**Reason:** Git provides versioning, review, auditability, rollback, and reproducible deployments.

**Rejected alternatives:**

- Editing platform contracts only in production databases.
- Maintaining undocumented configuration outside the repository.
- Using admin UI state as the only record of platform definitions.

**System impact:** Platform contract changes must be committed, reviewed, documented, and deployed. Database seeds may project Git-defined defaults but do not replace Git as their origin.

**Future changeability:** A different version-controlled platform source could replace Git, but only through a documented migration preserving review and history.

## ADR-004 — PostgreSQL is the official source for customer and operational data

**Decision:** PostgreSQL, accessed through Prisma and approved repositories/services, is the authoritative store for customer content, tenants, sites, sessions, subscriptions, payments, media metadata, admin operational state, audit records, and backup metadata.

**Reason:** Customer data requires transactional consistency, relations, indexing, tenant scoping, durability, and controlled migrations.

**Rejected alternatives:**

- Client-side state as persistent truth.
- Parallel JSON files for customer records.
- Unversioned ad-hoc storage outside the persistence layer.

**System impact:** Schema changes require Prisma review, migration planning, compatibility review, and documentation updates. Uploaded binary files may live in storage, but their business metadata and ownership remain in PostgreSQL.

**Future changeability:** The database technology can change only through a formal data migration. The principle of one authoritative customer data store remains.

## ADR-005 — Full Snapshot Backup exists for complete recoverability

**Decision:** The backup architecture supports a FULL snapshot containing the database plus uploads and platform-managed content artifacts required for recovery.

**Reason:** A database-only restore can leave media or content artifacts missing, while an uploads-only restore cannot reconstruct business state. Full snapshots provide a consistent disaster-recovery unit.

**Rejected alternatives:**

- Database-only backups as the sole recovery strategy.
- Filesystem-only backups.
- Reconstructing customer state from application defaults after failure.

**System impact:** Full backup and restore operations must verify manifests, checksums, required artifacts, compatibility, and restoration scope. Partial backup types may remain for operational frequency but do not replace full recovery snapshots.

**Future changeability:** The packaging or storage provider may change. Complete recoverability must remain.

## ADR-006 — Changing a template after site creation changes design, not customer content

**Decision:** A normal template change applies the selected visual contract and theme behavior while preserving the customer's normalized content.

**Reason:** Customer content is owned by the customer and must not be silently replaced by template demo or starter content.

**Rejected alternatives:**

- Re-running full signup provisioning on every template switch.
- Overwriting sections, packages, profile data, or galleries with template defaults.

**System impact:** Template switching must map existing content into the target renderer or provide compatibility behavior. Starter content is used for initial creation, not routine design changes.

**Future changeability:** Additional opt-in migration or reset workflows may be added, but destructive content replacement must remain explicit and separately authorized.

## ADR-007 — A snapshot is required before replacing site content

**Decision:** Before any explicit operation that replaces or materially resets persisted site content, the system creates a SiteContentSnapshot.

**Reason:** Content replacement is high-risk and must be reversible and auditable.

**Rejected alternatives:**

- Replacing content without recovery data.
- Depending only on database backups for a single-site rollback.
- Keeping only UI-level undo state.

**System impact:** Replacement flows must capture template code/version, reason, and relevant site data before mutation. Snapshot creation and replacement should be one controlled application workflow.

**Future changeability:** Snapshot format may evolve, but recoverability before destructive replacement is mandatory.

## ADR-008 — Living Documentation is part of the architecture

**Decision:** Documentation is maintained in the repository and updated in the same commit as related architectural or behavioral changes.

**Reason:** Static documentation becomes misleading when it is separated from delivery. Co-locating code and documentation keeps review and history aligned.

**Rejected alternatives:**

- One-time handover documents.
- External undocumented knowledge.
- Updating documentation in a later task.

**System impact:** A task is incomplete when affected documentation does not match the code. Developers and AI tools must read the documentation before implementation and resolve any code/documentation drift.

**Future changeability:** Tooling and document structure may evolve. The same-change synchronization rule remains mandatory.

## ADR-009 — Domain logic belongs in services; persistence access is isolated

**Decision:** Reusable business policy belongs in domain/application services, while persistence-specific behavior is isolated in repositories or Prisma-backed adapters.

**Reason:** This prevents pages, actions, routes, scripts, and tests from creating competing implementations.

**Rejected alternatives:**

- Business rules directly inside UI components.
- Repeating Prisma queries across unrelated entry points.
- Large generic utility files with hidden domain ownership.

**System impact:** Server Actions and API Routes orchestrate request concerns and call services. Repositories translate persistence operations without owning presentation behavior.

**Future changeability:** Small single-use operations may remain local when they are genuinely request-specific, but reusable policy must move to the domain layer.

## ADR-010 — Authentication uses opaque raw tokens and stored hashes

**Decision:** Session cookies contain cryptographically random opaque tokens; PostgreSQL stores only their hashes.

**Reason:** A database leak should not directly expose active raw session credentials.

**Rejected alternatives:**

- Storing raw session tokens.
- Authorizing only with client-visible state.
- Using UI visibility as permission enforcement.

**System impact:** Session lookup hashes the incoming token. Cookies remain HTTP-only, SameSite-controlled, and Secure in production. Admin authorization is enforced server-side with RBAC guards.

**Future changeability:** The session mechanism may evolve, but secrets must not be stored or exposed in reusable raw form.

## ADR-011 — Media upload accepts device files and validates real file content

**Decision:** User-facing image workflows upload device files through the approved media pipeline. The server validates declared type, size, and binary signature before storage.

**Reason:** Typed paths and URLs expose storage internals and permit inconsistent or unsafe inputs. MIME labels alone are not sufficient validation.

**Rejected alternatives:**

- Asking users to type filesystem paths or storage URLs.
- Trusting file extensions only.
- Separate unvalidated upload implementations per feature.

**System impact:** New image features reuse the central upload service, store ownership metadata, use unique sanitized keys, and expose safe URLs rather than internal storage keys.

**Future changeability:** Storage providers and accepted formats may evolve through the shared abstraction and documented validation policy.

## ADR-012 — Backward compatibility is the default

**Decision:** Existing tenants, sites, template versions, snapshots, public URLs, and persisted records must continue to work unless a breaking change is explicitly approved.

**Reason:** FrameID is a live multi-tenant platform; silent contract changes can damage customer sites and operational data.

**Rejected alternatives:**

- Reusing identifiers for incompatible behavior.
- Removing old renderers without migration.
- Assuming all databases are perfectly synchronized.

**System impact:** Changes may require additive schema evolution, compatibility adapters, legacy rendering, migration scripts, and documented rollback plans.

**Future changeability:** Individual compatibility paths may be retired only after an explicit migration and verified removal plan.