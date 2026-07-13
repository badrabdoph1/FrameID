# Data Flow

## Backup and restore

Manual وAuto وMigration وCLI وGitHub Actions تمر إلى `FrameID Backup Pipeline`. GitHub Actions Trigger فقط. الإكمال يتطلب Local Verify ثم GitHub Upload ثم Remote Verify ثم Retention ثم Audit. الاستعادة تستخدم المحلي أو تنزل من GitHub ثم تتحقق وتستعيد وتتحقق بعد الاستعادة.

تعديلات محتوى المنصة من الأدمن لا تُعتمد إلا بعد Commit إلى `main`. النصوص تحفظ داخل `content/`، وصور المنصة داخل `public/platform/`. لا تُسجل صور المنصة كملفات عميل ولا تدخل `public/uploads`؛ مجلد uploads مخصص لملفات العملاء ويدخل فقط في نسخة FULL.

## Request lifecycle

1. A browser request enters a Next.js route.
2. Server Components or Server Actions resolve the authenticated context.
3. Domain/application services validate policy and orchestrate behavior.
4. Prisma repositories read or mutate PostgreSQL.
5. Affected routes are revalidated and the user receives a redirect or typed result.

Client components handle interaction and previews; they must not become authoritative for persisted state.

## Signup and automatic site provisioning

1. Signup input is validated.
2. Lifecycle timer settings provide the current default trial duration.
3. The provisioning service checks identifier and slug availability.
4. A transaction creates the user, tenant, subscription, selected theme/template content, site, and initial related records.
5. Trial start/end dates are derived from one registration timestamp.
6. The new site is created as published and receives its public slug.
7. A hashed session token is stored; the raw token is returned only in the secure cookie.
8. Dashboard links use the configured platform URL, Railway domain, or Vercel domain before localhost fallback.

## Authenticated dashboard request

1. `frameid_session` is read from an HTTP-only cookie.
2. The raw value is hashed and matched against a valid non-revoked `Session` row.
3. User, tenant, site, subscription, and related context are loaded.
4. Customer lifecycle synchronization runs before returning the request session.
5. If trial/subscription state changed, the session context is re-read.
6. Dashboard pages query only the current tenant/site scope.

## Customer content update

1. A dashboard form or uploader submits to a Server Action.
2. The action resolves the current customer session.
3. Input is normalized and validated.
4. Prisma updates the owning normalized model: site, contact profile, package, extra, album, image, SEO settings, or theme configuration.
5. Dashboard, public site, and dependent summaries are revalidated.
6. Public rendering reads the updated persisted state.

## Media upload

1. The client selects or drops a file and may preview/compress it locally.
2. The original or processed `File` is submitted to a Server Action.
3. The server validates declared MIME type, size, and JPEG/PNG/WebP binary signature.
4. A safe unique storage key is generated.
5. The storage adapter writes the bytes.
6. A `MediaAsset` row stores URL, key, MIME type, size, optional dimensions/checksum/metadata, and tenant ownership.
7. Domain records reference the asset ID; the previous reference is not removed before a successful replacement.

## Template selection and rendering

1. Code-defined theme/template registry exposes compatible published templates and starter content.
2. Database `Template` records provide admin-managed status, ordering, version, preview data, settings, and optional cover references.
3. Provisioning copies starter content into normalized site records.
4. The site stores `templateCode` and `templateVersion` for compatibility.
5. Public rendering resolves the site, theme configuration, sections, packages, extras, contact, gallery, and media assets.
6. Content snapshots preserve significant site states when applicable.

## Publishing

1. Readiness is computed from persisted contact, portfolio, package, and SEO data.
2. Publishing updates `Site.status`, `isPublished`, version/timestamp fields, and revalidates the public route.
3. Public URLs are built from the platform base URL plus `/p/{slug}`, or from verified domain records where supported.
4. Unpublishing returns the site to a non-public editing state without deleting content.

## Admin mutation

1. Admin authentication is resolved separately from customer dashboard access.
2. `requireAdminPermission(center, action)` checks the role permission matrix.
3. The action validates the target and performs a scoped Prisma mutation.
4. Sensitive actions create audit log records with actor and target metadata.
5. Admin, public, and customer surfaces are revalidated as needed.

## Backup and restore

1. CLI/admin workflow creates a `BackupJob` for `DATABASE`, `UPLOADS`, or `FULL`.
2. The job transitions through pending/running to completed or a failure status.
3. Artifacts and verification metadata are recorded by the backup service/storage adapter.
4. Restore creates a separate restore record, validates the selected backup, and executes the applicable recovery path.
5. Restore operations must not bypass authorization, verification, or audit requirements.

## Change requirement

Any modification to one of these flows must update this file and the corresponding domain document in the same commit.
